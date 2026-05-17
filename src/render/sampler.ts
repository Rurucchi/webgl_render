export type Sampler = {
  id: string;
  magFilter: number | undefined;
  minFilter: number | undefined;
  parameters: any;
  wrapS: number | undefined;
  wrapT: number | undefined;
  glSampler: WebGLSampler;
};

export function createSampler(
  gl: WebGL2RenderingContext,
  id: string,
  magFilter: number | undefined,
  minFilter: number | undefined,
  parameters: any,
  wrapS: number | undefined,
  wrapT: number | undefined,
) {
  // creating
  const glSamplerParams = {
    id: "sampler-0",
    magFilter: magFilter,
    minFilter: minFilter,
    parameters: parameters,
    wrapS: wrapS,
    wrapT: wrapT,
  };

  const glSampler = gl.createSampler();

  for (const [pname, value] of Object.entries(glSamplerParams.parameters)) {
    if (typeof value === "number")
      gl.samplerParameteri(glSampler, Number(pname), value);
  }
  const sampler: Sampler = {
    id: id,
    magFilter: magFilter,
    minFilter: minFilter,
    parameters: parameters,
    wrapS: wrapS,
    wrapT: wrapT,
    glSampler: glSampler,
  };

  return sampler;
}
