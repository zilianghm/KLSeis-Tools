import { PGlite } from '@electric-sql/pglite'
import { live } from '@electric-sql/pglite/live'
import { electricSync } from '@electric-sql/pglite-sync'
import { Message } from '@arco-design/web-react'
import { t } from 'i18next'

export const pgliteInit = async () => {
    let db
    try {
        // 尝试创建或连接数据库
        db = await PGlite.create('idb://klseis-database', {
            extensions: {
                live, // 实时查询插件
                electric: electricSync(),
            },
        })
        console.log('数据库连接成功')
    } catch (error) {
        Message.error(t('databaseConnectionFailed'))
        console.error('数据库连接失败，请卸载面板后重新安装:', error)
        return
    }

    try {
        // 尝试查询 'setting' 表，检查是否存在
        await db.query(`SELECT * FROM setting LIMIT 1;`)
        console.log('数据库已存在，不用创建，开启程序')
    } catch (error) {
        // 如果查询失败，说明表不存在，执行初始化逻辑
        console.log('初始化数据库表...')
        try {
            // 读取 SQL 文件并执行（建表）, 备注： 跟随面板程序版本更新
            const sqlStrCreatData = await window.electron.ipcRenderer.invoke('read-creat-sql-file')
            await db.exec(sqlStrCreatData.content)

            // 读取 SQL 文件并执行（加入数据），备注：可独立同步更新，通过 http 接口方式，暂手动触发
            const sqlStrAddData = await window.electron.ipcRenderer.invoke('read-put-sql-file')
            await db.exec(sqlStrAddData.content)

            // 用户独立数据（建表）
            await db.exec(`DROP TABLE IF EXISTS "public"."setting";
                CREATE TABLE "public"."setting" (
                "id" int4 NOT NULL,
                "language" varchar(255) COLLATE "pg_catalog"."default",
                "theme" varchar(255) COLLATE "pg_catalog"."default",
                "name" varchar(255) COLLATE "pg_catalog"."default",
                "activated_nav" varchar(255) COLLATE "pg_catalog"."default",
                "installation_folder_path" varchar(255) COLLATE "pg_catalog"."default",
                "local_version_list" varchar(25500) COLLATE "pg_catalog"."default",
                "current_local_path" varchar(255) COLLATE "pg_catalog"."default",
                "data_version" varchar(255) COLLATE "pg_catalog"."default",
                "software_list" text COLLATE "pg_catalog"."default",
                "ai_session_list" text COLLATE "pg_catalog"."default"
                );
                ALTER TABLE "public"."setting" ADD CONSTRAINT "setting_pkey" PRIMARY KEY ("id");`)

            const currentDataVersion = await window.api.getVersion()

            // 用户独立数据（加入数据），即程序的某些功能参数初始化
            await db.exec(
                `insert into setting (id, language, name, theme, activated_nav, data_version) values (1, 'zh', '设置', 'light', 'cjsj', '${currentDataVersion}');`
            )
            console.log('数据库初始化完成')
        } catch (initError) {
            Message.error(t('databaseConnectionFailed'))
            console.error('数据库初始化失败:', initError)
        }
    }
    return db
}
