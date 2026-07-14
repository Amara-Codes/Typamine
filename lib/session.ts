// lib/session.ts
// Wrapper leggero per getServerSession — usato da server actions e layouts
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const getServerAuthSession = () => getServerSession(authOptions);
