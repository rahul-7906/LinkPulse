import { useEffect, useRef, useState } from "react"

// Self-contained WebGL2 stable-fluids cursor. All simulation state lives in
// half-float GPU textures; this canvas never intercepts pointer or touch input.
const vertexShader = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2); vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`

const shaders = {
  advect: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uSource,uVelocity; uniform vec2 uTexel; uniform float uDt,uDissipation;
void main(){ vec2 vel=texture(uVelocity,vUv).xy; vec2 uv=vUv-uDt*vel; outColor=texture(uSource,uv)*uDissipation; }`,
  splat: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uTarget; uniform vec2 uPoint,uAspect,uForce; uniform vec3 uColor; uniform float uRadius,uBurst,uIsVelocity;
void main(){ vec2 d=(vUv-uPoint)*uAspect; float g=exp(-dot(d,d)/uRadius); vec4 base=texture(uTarget,vUv); vec2 direction=normalize(d+vec2(0.00001)); vec2 kick=mix(uForce,direction*uBurst,uBurst>0.0?1.0:0.0); if(uIsVelocity>0.5) base.xy+=kick*g; else { base.rgb+=uColor*g; base.a=min(1.0,base.a+g*0.8); } outColor=base; }`,
  divergence: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uVelocity; uniform vec2 uTexel;
void main(){ float l=texture(uVelocity,vUv-vec2(uTexel.x,0)).x,r=texture(uVelocity,vUv+vec2(uTexel.x,0)).x; float b=texture(uVelocity,vUv-vec2(0,uTexel.y)).y,t=texture(uVelocity,vUv+vec2(0,uTexel.y)).y; outColor=vec4(0.5*(r-l+t-b),0,0,1); }`,
  curl: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uVelocity; uniform vec2 uTexel;
void main(){ float l=texture(uVelocity,vUv-vec2(uTexel.x,0)).y,r=texture(uVelocity,vUv+vec2(uTexel.x,0)).y; float b=texture(uVelocity,vUv-vec2(0,uTexel.y)).x,t=texture(uVelocity,vUv+vec2(0,uTexel.y)).x; outColor=vec4(0.5*(r-l-t+b),0,0,1); }`,
  vorticity: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uVelocity,uCurl; uniform vec2 uTexel; uniform float uDt,uStrength;
void main(){ float l=abs(texture(uCurl,vUv-vec2(uTexel.x,0)).r),r=abs(texture(uCurl,vUv+vec2(uTexel.x,0)).r); float b=abs(texture(uCurl,vUv-vec2(0,uTexel.y)).r),t=abs(texture(uCurl,vUv+vec2(0,uTexel.y)).r); float c=texture(uCurl,vUv).r; vec2 force=normalize(vec2(r-l,t-b)+vec2(0.00001))*c*uStrength*uDt; vec2 v=texture(uVelocity,vUv).xy+vec2(force.y,-force.x); outColor=vec4(v,0,1); }`,
  pressure: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uPressure,uDivergence; uniform vec2 uTexel;
void main(){ float l=texture(uPressure,vUv-vec2(uTexel.x,0)).r,r=texture(uPressure,vUv+vec2(uTexel.x,0)).r; float b=texture(uPressure,vUv-vec2(0,uTexel.y)).r,t=texture(uPressure,vUv+vec2(0,uTexel.y)).r; float d=texture(uDivergence,vUv).r; outColor=vec4((l+r+b+t-d)*0.25,0,0,1); }`,
  project: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uVelocity,uPressure; uniform vec2 uTexel;
void main(){ float l=texture(uPressure,vUv-vec2(uTexel.x,0)).r,r=texture(uPressure,vUv+vec2(uTexel.x,0)).r; float b=texture(uPressure,vUv-vec2(0,uTexel.y)).r,t=texture(uPressure,vUv+vec2(0,uTexel.y)).r; vec2 v=texture(uVelocity,vUv).xy-0.5*vec2(r-l,t-b); outColor=vec4(v,0,1); }`,
  display: `#version 300 es
precision highp float; in vec2 vUv; out vec4 outColor; uniform sampler2D uDye;
void main(){ vec4 d=texture(uDye,vUv); float a=min(d.a*1.15,0.30); vec3 c=vec3(0.34,0.29,0.70)*smoothstep(0.012,0.17,d.a); outColor=vec4(c,a); }`,
}

export default function CustomCursor() {
  const canvasRef = useRef(null)
  const [contextVersion, setContextVersion] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (window.matchMedia("(max-width: 700px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches) return undefined
    const gl = canvas?.getContext("webgl2", {
      alpha: true, premultipliedAlpha: false, antialias: false,
      depth: false, stencil: false, powerPreference: "high-performance",
    })
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return undefined
    gl.getExtension("OES_texture_float_linear")

    const programs = new Map()
    const resources = []
    const makeProgram = (fragment) => {
      const program = gl.createProgram()
      const compile = (type, source) => {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source); gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
        gl.attachShader(program, shader); gl.deleteShader(shader)
      }
      compile(gl.VERTEX_SHADER, vertexShader); compile(gl.FRAGMENT_SHADER, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
      resources.push(["program", program]); return program
    }
    try { Object.entries(shaders).forEach(([name, source]) => programs.set(name, makeProgram(source))) }
    catch { return undefined }

    const vao = gl.createVertexArray(); gl.bindVertexArray(vao)
    const makeTarget = (size, format) => {
      const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const externalFormat = format === gl.RGBA16F ? gl.RGBA : format === gl.RG16F ? gl.RG : gl.RED
      gl.texImage2D(gl.TEXTURE_2D, 0, format, size, size, 0, externalFormat, gl.HALF_FLOAT, null)
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
      resources.push(["texture", texture], ["framebuffer", fb])
      return { texture, fb, size }
    }
    const velocity = [makeTarget(128, gl.RG16F), makeTarget(128, gl.RG16F)]
    const pressure = [makeTarget(128, gl.R16F), makeTarget(128, gl.R16F)]
    const divergence = makeTarget(128, gl.R16F)
    const curl = makeTarget(128, gl.R16F)
    const dye = [makeTarget(1024, gl.RGBA16F), makeTarget(1024, gl.RGBA16F)]
    let vi = 0, pi = 0, di = 0, width = 1, height = 1, dpr = 1
    let previous = null, pendingMove = null, burst = null, lastTime = 0, frame = 0
    let running = false, lastInteraction = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); width = innerWidth; height = innerHeight
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const bind = (programName, target, uniforms, textures = []) => {
      const program = programs.get(programName); gl.useProgram(program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fb ?? null)
      gl.viewport(0, 0, target ? target.size : canvas.width, target ? target.size : canvas.height)
      textures.forEach(([name, texture], i) => {
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(gl.getUniformLocation(program, name), i)
      })
      Object.entries(uniforms).forEach(([name, value]) => {
        const loc = gl.getUniformLocation(program, name); if (loc == null) return
        if (typeof value === "number") gl.uniform1f(loc, value)
        else if (value.length === 2) gl.uniform2f(loc, value[0], value[1])
        else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2])
      })
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const clearTargets = (targets) => {
      gl.clearColor(0, 0, 0, 0)
      targets.forEach(target => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb)
        gl.viewport(0, 0, target.size, target.size)
        gl.clear(gl.COLOR_BUFFER_BIT)
      })
    }
    const splat = (x, y, dx, dy, isBurst = false) => {
      const point = [x / width, 1 - y / height], aspect = [width / height, 1]
      const color = [0.34, 0.29, 0.70]
      const radius = 0.00018
      const outV = 1 - vi
      bind("splat", velocity[outV], { uPoint: point, uAspect: aspect, uForce: [dx / width * 5, -dy / height * 5], uColor: color, uRadius: radius, uBurst: isBurst ? 0.16 : 0, uIsVelocity: 1 }, [["uTarget", velocity[vi].texture]])
      vi = outV
      const outD = 1 - di
      bind("splat", dye[outD], { uPoint: point, uAspect: aspect, uForce: [0, 0], uColor: color, uRadius: radius * 1.2, uBurst: 0, uIsVelocity: 0 }, [["uTarget", dye[di].texture]])
      di = outD
    }
    const scheduleRender = () => {
      if (!running) { running = true; frame = requestAnimationFrame(render) }
    }
    const onMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return
      const current = { x: event.clientX, y: event.clientY }
      if (previous) pendingMove = { ...current, dx: current.x - previous.x, dy: current.y - previous.y }
      previous = current
      lastInteraction = performance.now()
      scheduleRender()
    }
    const onDown = (event) => {
      if ((event.pointerType && event.pointerType !== "mouse") || !event.isPrimary) return
      burst = { x: event.clientX, y: event.clientY }
      lastInteraction = performance.now()
      scheduleRender()
    }
    const onUp = () => { previous = null }
    const advectPass = (source, target, velTexture, dissipation, dt) => bind("advect", target, { uTexel: [1 / source.size, 1 / source.size], uDt: dt, uDissipation: dissipation }, [["uSource", source.texture], ["uVelocity", velTexture]])

    const render = (time) => {
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.025) || 0.016; lastTime = time
      if (pendingMove) {
        const { x, y, dx, dy } = pendingMove
        splat(x, y, dx, dy)
        pendingMove = null
      }
      if (burst) {
        // The radial impulse shader emits in every direction from the click.
        splat(burst.x, burst.y, 0, 0, true)
        burst = null
      }
      advectPass(velocity[vi], velocity[1 - vi], velocity[vi].texture, 0.985, dt); vi = 1 - vi
      advectPass(dye[di], dye[1 - di], velocity[vi].texture, 0.91, dt); di = 1 - di
      bind("curl", curl, { uTexel: [1 / 128, 1 / 128] }, [["uVelocity", velocity[vi].texture]])
      bind("vorticity", velocity[1 - vi], { uTexel: [1 / 128, 1 / 128], uDt: dt, uStrength: 16 }, [["uVelocity", velocity[vi].texture], ["uCurl", curl.texture]])
      vi = 1 - vi
      bind("divergence", divergence, { uTexel: [1 / 128, 1 / 128] }, [["uVelocity", velocity[vi].texture]])
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure[0].fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); pi = 0
      for (let i = 0; i < 20; i++) {
        const next = 1 - pi
        bind("pressure", pressure[next], { uTexel: [1 / 128, 1 / 128] }, [["uPressure", pressure[pi].texture], ["uDivergence", divergence.texture]])
        pi = next
      }
      bind("project", velocity[1 - vi], { uTexel: [1 / 128, 1 / 128] }, [["uVelocity", velocity[vi].texture], ["uPressure", pressure[pi].texture]])
      vi = 1 - vi
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
      bind("display", null, {}, [["uDye", dye[di].texture]])
      if (performance.now() - lastInteraction < 1400) frame = requestAnimationFrame(render)
      else {
        clearTargets([...dye, ...velocity, ...pressure, divergence, curl])
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
        running = false; previous = null; lastTime = 0
      }
    }
    const onContextLost = (event) => { event.preventDefault(); running = false; cancelAnimationFrame(frame) }
    const onContextRestored = () => setContextVersion(version => version + 1)
    resize()
    window.addEventListener("resize", resize); window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true }); window.addEventListener("pointerup", onUp, { passive: true })
    canvas.addEventListener("webglcontextlost", onContextLost)
    canvas.addEventListener("webglcontextrestored", onContextRestored)

    return () => {
      cancelAnimationFrame(frame); window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onDown); window.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("webglcontextlost", onContextLost); canvas.removeEventListener("webglcontextrestored", onContextRestored)
      resources.forEach(([type, resource]) => type === "program" ? gl.deleteProgram(resource) : type === "texture" ? gl.deleteTexture(resource) : gl.deleteFramebuffer(resource))
      gl.deleteVertexArray(vao)
    }
  }, [contextVersion])

  return <canvas key={contextVersion} ref={canvasRef} className="fluid-cursor-canvas" aria-hidden="true" />
}
