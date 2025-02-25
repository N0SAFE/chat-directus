// Automatically generated by declarative-routing, do NOT edit
import { z } from "zod";
import { makeRoute } from "./makeRoute";

const defaultInfo = {
  search: z.object({})
};

import * as HomeRoute from "@/app/page.info";
import * as AppshowcaseRoute from "@/app/(app)/showcase/page.info";
import * as ApiauthnextauthRoute from "@/app/api/auth/[...nextauth]/route.info";
import * as AuthloginRoute from "@/app/auth/login/page.info";
import * as AuthmeRoute from "@/app/auth/me/page.info";
import * as ChatRoute from "@/app/chats/page.info";
import * as MiddlewareerrorenvRoute from "@/app/middleware/error/env/page.info";
import * as MiddlewareerrorhealthCheckRoute from "@/app/middleware/error/healthCheck/page.info";

export const Home = makeRoute(
  "/",
  {
    ...defaultInfo,
    ...HomeRoute.Route
  }
);
export const Appshowcase = makeRoute(
  "/(app)/showcase",
  {
    ...defaultInfo,
    ...AppshowcaseRoute.Route
  }
);
export const Apiauthnextauth = makeRoute(
  "/api/auth/[...nextauth]",
  {
    ...defaultInfo,
    ...ApiauthnextauthRoute.Route
  }
);
export const Authlogin = makeRoute(
  "/auth/login",
  {
    ...defaultInfo,
    ...AuthloginRoute.Route
  }
);
export const Authme = makeRoute(
  "/auth/me",
  {
    ...defaultInfo,
    ...AuthmeRoute.Route
  }
);
export const Chat = makeRoute(
  "/chats",
  {
    ...defaultInfo,
    ...ChatRoute.Route
  }
);
export const Middlewareerrorenv = makeRoute(
  "/middleware/error/env",
  {
    ...defaultInfo,
    ...MiddlewareerrorenvRoute.Route
  }
);
export const MiddlewareerrorhealthCheck = makeRoute(
  "/middleware/error/healthCheck",
  {
    ...defaultInfo,
    ...MiddlewareerrorhealthCheckRoute.Route
  }
);

