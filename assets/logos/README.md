# 厂商标志

原文件来自用户提供的 `logos` 文件夹，保存在 `original/`。标志权利归各厂商所有。

网站使用 `web/public/logos/*.png`：统一128×128像素、RGBA透明PNG，裁去原有外围留白，按比例缩放至104×104以内并居中，四周至少12像素留白。DeepSeek仅移除与外边界连通的近白背景，保留内部白色细节。

重新转换：

```bash
python3 -m pip install -r requirements-logos.txt
python3 scripts/prepare_logos.py
```

`manifest.json`保存来源、输出文件及各自的SHA-256。预处理结果随仓库上传；常规网站构建不需要重新安装图像转换依赖。
