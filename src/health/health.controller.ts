import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Lightweight liveness + memory probe.
 *
 * Intentionally does NOT touch the database or Redis — it must remain
 * cheap enough to hit on a 1s interval from Docker / load balancers,
 * even if Postgres is down.
 *
 * Use `/health/memory` as a metric source for dashboards so heap growth
 * can be caught before the process OOMs.
 */
@ApiTags('Health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('memory')
  @ApiOperation({
    summary: 'Process memory usage (rss / heapUsed / heapTotal / external)',
  })
  memory(): {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
    arrayBuffersMb: number;
    heapLimitMb: number | null;
    uptimeSeconds: number;
    timestamp: string;
  } {
    const mem = process.memoryUsage();
    const toMb = (bytes: number) =>
      Math.round((bytes / 1024 / 1024) * 100) / 100;

    // Best-effort heap size limit via V8. Falls back to null on platforms
    // that don't expose it.
    let heapLimitMb: number | null = null;
    try {
      const v8 = require('v8') as typeof import('v8');
      const stats = v8.getHeapStatistics();
      heapLimitMb = toMb(stats.heap_size_limit);
    } catch {
      heapLimitMb = null;
    }

    return {
      rssMb: toMb(mem.rss),
      heapUsedMb: toMb(mem.heapUsed),
      heapTotalMb: toMb(mem.heapTotal),
      externalMb: toMb(mem.external),
      arrayBuffersMb: toMb(mem.arrayBuffers ?? 0),
      heapLimitMb,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
