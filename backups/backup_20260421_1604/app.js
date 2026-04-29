App({
  onLaunch() {
    console.log("[app] onLaunch fired");

    // 初始化云开发
    try {
      wx.cloud.init({
        env: 'cloudbase-1g45jezp2ea37dc9', // TODO: 替换为你的云开发环境ID
        traceUser: true
      });
      console.log("Cloud initialized");
    } catch (err) {
      console.error("Cloud init failed:", err);
      wx.showToast({
        title: '云服务初始化失败',
        icon: 'none'
      });
    }

    // Load STKaiti font for Android (iOS has it built-in)
    const systemInfo = wx.getSystemInfoSync();
    const isIOS = systemInfo.platform === 'ios';
    const isDevTool = systemInfo.platform === 'devtools'; // 模拟器

    // 模拟器和iOS不需要加载楷体（系统已内置）
    if (!isIOS && !isDevTool) {
      // Android does not have KaiTi built-in, load from cloud storage
      // IMPORTANT: Upload a KaiTi TTF file to your cloud storage and replace the URL below
      // Recommended free font: 方正楷体 (FZKai-Z03) or 楷体_GB2312
      // Steps:
      //   1. Go to WeChat DevTools → Cloud Storage
      //   2. Upload a KaiTi .ttf file (e.g. kaiti.ttf)
      //   3. Get the download URL (right-click → copy URL)
      //   4. Replace KAITI_FONT_URL below with that URL
      const KAITI_FONT_URL = 'https://636c-cloudbase-1g45jezp2ea37dc9-1419865019.tcb.qcloud.la/fonts/kaiti.ttf?sign=37856bf85915fed6a24fb8fe98884946&t=1775612642';

      if (KAITI_FONT_URL) {
        wx.loadFontFace({
          global: true,
          family: 'STKaiti',
          source: `url("${KAITI_FONT_URL}")`,
          success: () => console.log('STKaiti font loaded for Android'),
          fail: (err) => console.warn('STKaiti font load failed, using fallback serif', err)
        });
      } else {
        console.log('KaiTi font URL not set, using system serif on Android');
      }
    } else {
      console.log(isDevTool ? 'DevTools detected, using system STKaiti' : 'iOS detected, using built-in STKaiti');
    }
  }
});
