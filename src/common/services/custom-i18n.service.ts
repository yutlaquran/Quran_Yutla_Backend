import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class CustomI18nService {
  constructor(private i18n: I18nService) {}

  public t(key: string, options?: any): string {
    if (!this.i18n) {
      console.error('I18nService is not available in CustomI18nService');
      return key;
    }

    try {
      const lang = I18nContext.current()?.lang || 'ar';
      // Fix: Pass options as args property
      return this.i18n.t(key, {
        lang,
        args: options || {},
      });
    } catch (error) {
      console.error(`I18n translation error for key "${key}":`, error);
      console.error('Options passed:', options);
      return key;
    }
  }
}
