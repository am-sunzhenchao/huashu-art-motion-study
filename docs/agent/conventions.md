# 项目特有约定

## 命名

- 场景两位数字 id 与配方卡一一对应：`scenes/09_postimp.js` ↔ `references/风格配方/09_postimp.md`
- 语法前缀：`y1`–`y6`（YouTube 风格）、`t1`–`t3`（技术风格）
- 文件名大量使用中文：`镜头表.md`、`成片.mp4`、`交付说明.md`、`风格配方/`、`动画语法/`
- 文档、注释以中文为主（`README.en.md` 为英文版）

## 硬性创作规则（SKILL.md 定义，脚本强制）

- **红绿灯**：红灯禁止交付——快推帧比 < 0.035、空白帧 > 0.3s、蓝紫帧 ≥ 30%；黄灯警告。蓝紫"AI 味"渐变默认禁用，除非 `--allow-blue-purple "理由"`
- **禁止照搬示范**：demos/ 与 examples/ 内容不得复制进交付物
- **三方向硬门**：新角色/风格方向须先出 3 个构图明显不同的变体
- **独立审片**：交付前由独立 review agent 写 `<项目>/审片/*.md`
- `deliver.py` 产出的交付说明是脚本指纹化写入的事实，不可手改（`--verify` 校验）

## 确定性契约

所有随机性必须播种；QA 做冷热双渲染像素一致性检查。

## 版本检查协议

SKILL.md 指示 agent 读取 `.last-update-check`，用 `git ls-remote --tags` 对比 `metadata.version`，30/7 天退避，升级由用户决定。

## 发布卫生

`release-manifest.json` + `scripts/check_release.py` 审计 git 对象（非磁盘文件），防止凭证先提交后删除的漏检。

## Python 脚本风格

所有 CLI 使用 PEP 723 内联 script metadata，由 `uv run` 解析依赖——新增脚本沿用此模式。
