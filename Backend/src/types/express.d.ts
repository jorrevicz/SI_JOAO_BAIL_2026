declare global {
  namespace Express {
    interface Request {
      codUser?: number;
    }
  }
}

export {};
