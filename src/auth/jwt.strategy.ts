/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { StrategyOptions, JwtFromRequestFunction } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtFromRequest: JwtFromRequestFunction = (
      req: Request,
    ): string | null => {
      const authHeader = req.headers?.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return null;
    };
    const secretOrKey = configService.get<string>('JWT_SECRET', 'change-me');
    const options: StrategyOptions = {
      jwtFromRequest: jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey,
    };
    super(options);
  }

  async validate(payload: {
    sub: number;
    email: string;
  }): Promise<{ userId: number; email: string }> {
    return Promise.resolve({ userId: payload.sub, email: payload.email });
  }
}
