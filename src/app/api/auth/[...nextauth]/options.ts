//@ts-nocheck
import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const baseURL = process.env.NEXT_PUBLIC_HOSTNAME + 'login';

export const options: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    // GitHubProvider({
    //   clientId: process.env.GITHUB_ID as string,
    //   clientSecret: process.env.GITHUB_SECRET as string,
    // }),
    // GoogleProvider({
    //   clientId: process.env.NEXT_GOOGLE_CLIENT_ID as string,
    //   clientSecret: process.env.NEXT_GOOGLE_CLIENT_SECRET as string,
    // }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'email', placeholder: '' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // This is where you need to retrieve user data
        // to verify with credentials
        // Docs: https://next-auth.js.org/configuration/providers/credentials
        const requestBody = {
          email: credentials.email,
          password: credentials.password,
        };
        const res = await fetch(baseURL, {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });
        const resdata = await res.json();
        console.log('Login...', resdata);
        if (
          resdata.status === 400 ||
          resdata.status === 401 ||
          resdata.status === 403 ||
          resdata.status === 500
        ) {
          return null;
        }
        if (resdata.status === 200 || resdata.status === 201) {
          return resdata;
        }
        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  callbacks: {
    // async jwt({ token, user }) {
    //   // the user present here gets the same data as received from DB call  made above -> fetchUserInfo(credentials.opt)
    //   return { ...token, ...user };
    // },
    // async session({ session, user, token }) {
    //   // user param present in the session(function) does not recive all the data from DB call -> fetchUserInfo(credentials.opt)
    //   session.user.role = user.role; // Add role to session
    //   return token;
    // },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        console.log({ user });
        token.role = user.data.role;
        token.id = user.data.id;
        token.name = user.data.name;
        token.email = user.data.email;
        // Add any other user properties you want to include
      }
      return token;
    },
    // Handling the session
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        // Add any other user properties you want to include
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.JWT_SECRET,
};
