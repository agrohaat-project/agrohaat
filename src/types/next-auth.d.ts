import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isApproved: boolean;
      isSuspended: boolean;
    };
  }
  interface User {
    id: string;
    role: string;
    isApproved: boolean;
    isSuspended: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    isApproved: boolean;
    isSuspended: boolean;
  }
}
