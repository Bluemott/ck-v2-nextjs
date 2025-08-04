declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CDK_DEFAULT_ACCOUNT?: string;
      CDK_DEFAULT_REGION?: string;
      [key: string]: string | undefined;
    }
  }
  
  var process: {
    env: NodeJS.ProcessEnv;
  };
}

export {}; 