import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production with auth token
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only when auth token is available
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Hide source maps from generated client bundles
  hideSourceMaps: true,

  // Transpile SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,
};

// Only wrap with Sentry if we have the configuration
const config = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
