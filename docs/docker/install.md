# 安装

## 安装（官网脚本）
```bash
curl -fsSL https://get.docker.com | bash -s docker
```

## 安装（阿里云源包）
```bash
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
```

## 配置国内镜像仓库

## 如何配置 Docker 镜像加速器

Docker Hub 是官方的 Docker 镜像仓库，但由于网络原因，国内用户访问 Docker Hub 可能会比较慢。配置镜像加速器可以显著提升拉取 Docker 镜像的速度。

以下是常见的 Docker Hub 镜像加速器地址：

| DockerHub镜像仓库    | 镜像加速器地址                    |
| -------------------- | --------------------------------- |
| 毫秒镜像             | `docker.1ms.run`                  |
| Docker Hub Search    | `docker.mybacc.com`               |
| Docker Hub Search    | `https://dytt.online`             |
| Docker Hub Search    | `https://lispy.org`               |
| Docker Hub Search    | `docker.xiaogenban1993.com`       |
| Docker Hub Search    | `docker.yomansunter.com`          |
| Docker Hub Search    | `aicarbon.xyz`                    |
| Docker Hub Search    | `666860.xyz`                      |

**注意：** 建议选择一个或少数几个稳定可靠的镜像源进行配置，而不是全部添加。过多的镜像源可能会导致不必要的复杂性。通常，`docker.1ms.run` 是一个不错的选择。

### 配置方法

Docker 的配置文件是 `daemon.json`。你需要修改这个文件来添加镜像加速器的配置。

#### 1. 定位或创建 `daemon.json` 文件

*   **Linux 用户:** 文件通常位于 `/etc/docker/daemon.json`。如果文件不存在，请创建它。
*   **macOS 用户:**
    *   通过 Docker Desktop 图形化界面配置通常更简单：
        1.  打开 Docker Desktop。
        2.  点击菜单栏的 Docker 图标，选择 "Preferences" (或 "Settings")。
        3.  在左侧导航栏中选择 "Docker Engine"。
        4.  在右侧的 JSON 配置编辑器中添加或修改 `registry-mirrors`。
    *   如果希望手动配置，文件路径通常是 `~/.docker/daemon.json`。
*   **Windows 用户:**
    *   通过 Docker Desktop 图形化界面配置通常更简单：
        1.  打开 Docker Desktop。
        2.  右键点击系统托盘中的 Docker 图标，选择 "Settings"。
        3.  在左侧导航栏中选择 "Docker Engine"。
        4.  在右侧的 JSON 配置编辑器中添加或修改 `registry-mirrors`。
    *   如果希望手动配置，文件路径通常是 `%programdata%\docker\config\daemon.json`。

#### 2. 修改 `daemon.json` 文件

打开 `daemon.json` 文件（如果文件不存在，请创建它），并添加以下内容。如果你已经有其他配置，请确保 JSON 格式正确。

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.mybacc.com"
  ]
}
```

**重要提示:**

*   请将 `"https://docker.1ms.run"` 和 `"https://docker.mybacc.com"` 替换为你实际选择的镜像加速器地址。
*   `registry-mirrors` 的值是一个包含多个镜像地址的数组（字符串列表）。
*   确保整个文件是有效的 JSON 格式。如果文件中已有其他配置，请将 `"registry-mirrors"` 作为一个新的键值对添加，或者合并到已有的 JSON 对象中。例如，如果你的 `daemon.json` 原本是：
    ```json
    {
      "exec-opts": ["native.cgroupdriver=systemd"]
    }
    ```
    修改后应该是：
    ```json
    {
      "exec-opts": ["native.cgroupdriver=systemd"],
      "registry-mirrors": [
        "https://docker.1ms.run"
      ]
    }
    ```

#### 3. 重启 Docker 服务

配置修改完成后，需要重启 Docker 服务才能使更改生效。

*   **Linux 用户:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```
*   **macOS 和 Windows 用户:**
    通过 Docker Desktop 图形化界面操作：
    1.  在 "Preferences" 或 "Settings" 中的 "Docker Engine" 页面，点击 "Apply & Restart"。
    2.  或者，直接退出 Docker Desktop 然后重新启动它。

#### 4. 验证配置是否生效

你可以通过以下命令来验证配置是否生效：

```bash
docker info
```

在输出的信息中，查找 "Registry Mirrors" 部分，如果看到你配置的加速器地址，则说明配置成功。

```
...
Registry Mirrors:
 https://docker.1ms.run/
 https://docker.mybacc.com/
...
```

现在，当你使用 `docker pull` 命令拉取镜像时，Docker 会尝试从配置的镜像加速器下载，从而提高下载速度。