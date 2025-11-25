export type SentryConfig = {
  dsn: string | null;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  profilesSampleRate: number;
};
