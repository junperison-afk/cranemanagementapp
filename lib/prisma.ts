import { PrismaClient } from "@prisma/client";

// Prismaクライアントのシングルトンインスタンス
// Next.jsの開発環境でホットリロード時に複数のインスタンスが作成されるのを防ぐ

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 接続プーリング環境でのプリペアドステートメントエラーを防ぐため、
// 接続URLに適切なパラメータを追加
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // pgbouncerを使用している場合、接続パラメータを追加
  if (url.includes("pgbouncer=true")) {
    // 既にパラメータがある場合は追加しない
    if (url.includes("?")) {
      // 既存のパラメータがある場合、必要なパラメータを追加
      if (!url.includes("connect_timeout")) {
        return `${url}&connect_timeout=15`;
      }
      return url;
    } else {
      return `${url}?connect_timeout=15`;
    }
  }
  
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

