export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: HealthStatus;
  responseTime: number;
  lastCheck: Date;
  error?: Error;
}
