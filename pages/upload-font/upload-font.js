// 上传楷体字体文件到云存储的脚本
// 使用方法：在开发者工具控制台运行，或者创建一个页面执行

Page({
  data: {
    uploading: false,
    progress: 0,
    status: '',
    fileUrl: ''
  },

  onLoad() {
    // 从 Windows 本地读取楷体文件
    // 注意：小程序不能直接访问本地文件系统，需要手动选择文件
    this.showToast('点击"选择并上传"按钮选择楷体文件');
  },

  // 选择并上传字体文件
  async uploadFontFile() {
    this.setData({ uploading: true, status: '正在选择文件...', progress: 0 });

    // 先选择文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const file = res.tempFiles[0];

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.ttf')) {
          this.showToast('请选择 .ttf 字体文件', 'error');
          this.setData({ uploading: false });
          return;
        }

        this.setData({ status: `正在上传: ${file.name}`, progress: 10 });

        // 上传到云存储
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `fonts/kaiti.ttf`, // 存储路径
            filePath: file.path,
            success: (res) => {
              console.log('Upload success:', res);
              this.setData({
                status: `上传成功！\n文件ID: ${res.fileID}`,
                fileUrl: res.fileID,
                uploading: false,
                progress: 100
              });

              // 显示文件ID，复制到 app.js 使用
              wx.showModal({
                title: '上传成功',
                content: `文件已上传到云存储\n\n文件ID:\n${res.fileID}\n\n下载地址(需要获取):\n请在云开发控制台 → 存储 → fonts/kaiti.ttf 右键复制下载地址`,
                showCancel: false,
                confirmText: '复制文件ID',
                success: () => {
                  wx.setClipboardData({
                    data: res.fileID,
                    success: () => this.showToast('文件ID已复制，请在云存储控制台获取完整下载地址')
                  });
                }
              });
            },
            fail: (err) => {
              console.error('Upload failed:', err);
              this.setData({
                status: `上传失败: ${JSON.stringify(err)}`,
                uploading: false
              });
              this.showToast('上传失败，请检查云开发配置', 'error');
            }
          });
        } catch (err) {
          console.error('Upload error:', err);
          this.setData({ status: `错误: ${err}`, uploading: false });
        }
      },
      fail: (err) => {
        console.error('Choose file failed:', err);
        this.setData({
          status: '选择文件失败',
          uploading: false
        });
        this.showToast('取消选择文件');
      }
    });
  },

  // 获取云存储文件列表
  async listFiles() {
    try {
      this.setData({ status: '正在查询云存储文件...' });
      const res = await wx.cloud.getTempFileURL({
        fileList: ['cloud://cloudbase-1g45jezp2ea37dc9.636c-cloudbase-1g45jezp2ea37dc9-1316808272/fonts/kaiti.ttf']
      });

      if (res.fileList[0].status === 0) {
        this.setData({
          status: `文件已存在\n下载地址:\n${res.fileList[0].tempFileURL}`,
          fileUrl: res.fileList[0].tempFileURL
        });
      } else {
        this.setData({ status: `文件查询失败: ${res.fileList[0].errMsg}` });
      }
    } catch (err) {
      this.setData({ status: `查询错误: ${err}` });
    }
  },

  showToast(msg, icon = 'none') {
    wx.showToast({ title: msg, icon, duration: 3000 });
  }
});
