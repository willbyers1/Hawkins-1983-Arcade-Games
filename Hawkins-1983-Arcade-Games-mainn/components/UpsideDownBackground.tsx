// components/UpsideDownBackground.tsx
import React, { useEffect, useRef } from 'react';

const UpsideDownBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // --- SHADER KODLARI ---
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;

      // Gürültü Fonksiyonları
      float random (in vec2 _st) {
        return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))* 43758.5453123);
      }

      float noise (in vec2 _st) {
        vec2 i = floor(_st);
        vec2 f = fract(_st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      #define NUM_OCTAVES 5
      float fbm ( in vec2 _st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < NUM_OCTAVES; ++i) {
          v += a * noise(_st);
          _st = rot * _st * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy;
        st.x *= u_resolution.x/u_resolution.y;

        vec2 q = vec2(0.);
        q.x = fbm( st + 0.00*u_time);
        q.y = fbm( st + vec2(1.0));

        vec2 r = vec2(0.);
        r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time );
        r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);

        float f = fbm(st+r);

        // Stranger Things Renk Paleti
        vec3 color = mix(vec3(0.1, 0.0, 0.0),
                         vec3(0.6, 0.05, 0.05),
                         clamp((f*f)*4.0,0.0,1.0));

        color = mix(color,
                    vec3(0.9, 0.1, 0.1),
                    clamp(length(q),0.0,1.0));

        color = mix(color,
                    vec3(1.0, 0.2, 0.2),
                    clamp(length(r.x),0.0,1.0));

        // Şimşek Efekti
        float lightning = sin(u_time * 5.0 + random(vec2(u_time)) * 10.0);
        lightning = smoothstep(0.95, 0.99, lightning) * random(vec2(u_time * 2.0));
        vec3 lightningColor = vec3(1.0, 0.9, 0.8) * lightning * 0.9;
        color += lightningColor;

        // Vinyet
        vec2 centerCoord = gl_FragCoord.xy / u_resolution.xy - 0.5;
        float vignette = 1.0 - dot(centerCoord, centerCoord) * 1.5;
        color *= vignette;
        
        gl_FragColor = vec4((f*f*f+.6*f*f+.5*f)*color,1.);
      }
    `;

    // WebGL Kurulumu
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    let startTime = Date.now();
    const render = () => {
      if (!canvas || !gl) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (Date.now() - startTime) * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
       if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Mind Flayer Silüeti - public klasöründeki dosya */}
      <img 
        src="/mind-flayer.png" 
        alt="" 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto h-[60vh] md:h-[70vh] object-contain opacity-70 mix-blend-overlay brightness-75 blur-[1px]"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export default UpsideDownBackground;