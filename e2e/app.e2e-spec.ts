import { DataVisPage } from './app.po';

describe('data-vis App', function() {
  let page: DataVisPage;

  beforeEach(() => {
    page = new DataVisPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
