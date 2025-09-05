import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  imports: [RouterModule, NgxSpinnerModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'optics';

  // npx nx g @nx/angular:component --help
  // npx nx g @nx/angular:module --help
  // npx nx g @nx/angular:component apps/optics/src/app/login/login
  // npx nx g @nx/angular:module auth --project=optics --routing
  // npx nx g @nx/angular:setup-tailwind optics
  // npx nx g @nx/angular:service services/RestClient/rest-client --project=optics

  // npx nx g @nx/angular:service services/common/common --project=optics
}
