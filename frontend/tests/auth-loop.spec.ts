import { test, expect, type Frame } from '@playwright/test';

test('Track authentication redirection loop', async ({ page }) => {
  const urls: string[] = [];

  // Lắng nghe sự thay đổi URL
  page.on('framenavigated', (frame: Frame) => {
    if (frame === page.mainFrame()) {
      const url = page.url();
      urls.push(url);
      console.log(`[NAV] -> ${url}`);
    }
  });

  console.log('--- Bắt đầu truy cập http://localhost:3000 ---');
  await page.goto('http://localhost:3000');

  // Đợi 10 giây để quan sát vòng lặp
  await page.waitForTimeout(10000);

  console.log('--- Danh sách các URL đã đi qua: ---');
  urls.forEach((url, index) => console.log(`${index + 1}. ${url}`));

  // Nếu bị kẹt ở login, thử login và xem loop có tiếp diễn không
  if (page.url().includes('/login')) {
    console.log('Thử đăng nhập để xem có bị loop quay lại login không...');
    await page.fill('input[name="email"]', 'abf@gmail.com');
    await page.fill('input[name="password"]', '123456'); // Giả sử mật khẩu này đúng
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('URL sau khi đăng nhập:', page.url());
  }
});
