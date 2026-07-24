import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Custom TitleStrategy customizing browser page titles dynamically.
 */
@Injectable({
  providedIn: 'root',
})
export class AppTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly APP_SUFFIX = 'nidhiFlow';

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);

    if (title !== undefined && title.length > 0) {
      this.titleService.setTitle(`${title} | ${this.APP_SUFFIX}`);
    } else {
      this.titleService.setTitle(`${this.APP_SUFFIX} - Personal Finance & Cash Flow Suite`);
    }
  }
}
