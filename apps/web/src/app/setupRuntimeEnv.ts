type GlobalWithRuntimeEnv = typeof globalThis & {
  __APP_RUNTIME_ENV__?: ImportMetaEnv;
};

const runtimeGlobal = globalThis as GlobalWithRuntimeEnv;
runtimeGlobal.__APP_RUNTIME_ENV__ = import.meta.env;
