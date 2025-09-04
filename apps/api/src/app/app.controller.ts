import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // npx nx serve api --verbose=false --output-style=stream

  @Get()
  getData() {
    return this.appService.getData();
  }
}



// npx nx g @nrwl/nest:library --name=opticsdb --directory=libs --linter=none --unit-test-runner=none
