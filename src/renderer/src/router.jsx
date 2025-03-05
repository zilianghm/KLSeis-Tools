import { createHashRouter } from 'react-router-dom'
import mockData from './assets/mock/navHomeData.json'
import mockRecommendData from './assets/mock/navRecommendData.json'
import { MainContent } from './pages/MainContent/MainContent'
import { MainLayout } from './layout/MainLayout'
import _ from 'lodash'
import { AppDetail } from './pages/AppDetail/AppDetail'

export const createHashRouterFunc = (language, navList, appList) => {
    const nav = []
    const routerData = []
    const data = _.cloneDeep(mockData)
    const sqlData = navList?.map(item => {
        return {
            ...item,
            children: appList
                ?.filter(p => p.category_id === item.category_id)
                .sort((a, b) => Number(a?.sort) - Number(b?.sort)),
        }
    })
    data[0].splice(1, 0, ...sqlData)

    console.log('渲染总数据', data)

    data.forEach((arr, index) => {
        const nodeArr = []
        arr.forEach(item => {
            routerData.push({
                ...item,
                path: item.code,
                element: (
                    <MainContent
                        type={item.code}
                        data={item.children}
                        mockRecommendData={mockRecommendData}
                        title={language === 'zh' ? item.category_name : item.category_name_en}
                        describe={{ charts: item.charts, context: item.context, context_en: item.context_en }}
                    />
                ),
            })
            nodeArr.push(
                <div className={`nav-item ${item.code}`} key={item.code}>
                    <span
                        className='nav-item-icon'
                        style={{ backgroundImage: `url('data:image/png;base64,${item.logo}')` }}
                    ></span>
                    <span className='nav-item-text'>
                        {language === 'zh' ? item.category_name : item.category_name_en}
                    </span>
                </div>
            )
        })
        nav.push(
            <div className='nav-group' key={`nav-group${index}`}>
                {nodeArr}
            </div>
        )
        routerData.push({
            path: 'app/detail/:app_id',
            element: <AppDetail />,
        })
    })
    return createHashRouter([
        {
            path: '/',
            element: <MainLayout nav={nav} />,
            children: routerData,
        },
    ])
}
