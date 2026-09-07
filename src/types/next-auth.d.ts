import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: "PRIVATE" | "BUSINESS";
    } & DefaultSession["user"];
  }

  interface User {
    accountType?: "PRIVATE" | "BUSINESS";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accountType?: "PRIVATE" | "BUSINESS";
  }
}
