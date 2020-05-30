import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/layout'
// import db from '@/utils/localstorage'
// import request from '@/utils/request'
import store from '@/store/index'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

Vue.use(Router)

const constRouter = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: (resolve) => require(['@/views/redirect/index'], resolve)
      }
    ]
  },
  {
    path: '/404',
    component: (resolve) => require(['@/views/error-page/404'], resolve),
    hidden: true
  },
  {
    path: '/login',
    name: '登录页',
    component: (resolve) => require(['@/views/login/index'], resolve)
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: (resolve) => require(['@/views/dashboard/index'], resolve),
        name: 'Dashboard',
        meta: { title: 'dashboard', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: (resolve) => require(['@/views/profile/index'], resolve),
        name: 'Profile',
        meta: { title: 'profile', icon: 'user', noCache: true }
      }
    ]
  },
  {
    path: '/error',
    component: Layout,
    redirect: 'noRedirect',
    name: 'ErrorPages',
    meta: {
      title: 'errorPages',
      icon: '404'
    },
    children: [
      {
        path: '404',
        component: (resolve) => require(['@/views/error-page/404'], resolve),
        name: 'Page404',
        meta: { title: 'page404', noCache: true }
      }
    ]
  }
]

const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes: constRouter
})

const whiteList = ['/login']

let asyncRouter

// 导航守卫，渲染动态路由
router.beforeEach((to, from, next) => {
  console.log('path start')
  NProgress.start()
  if (whiteList.indexOf(to.path) !== -1) {
    next()
  } else {
    // const token = db.get('ACCESS_TOKEN')
    // const user = db.get('USER')
    // const userRouter = get('USER_ROUTER')
    // console.log(userRouter)
    // if (token.length && user) {
    if (!asyncRouter) {
    //   if (!userRouter) {
      // request.get(`system/menu/${user.username}`).then((res) => {
      const permissions = ['user:view', 'role:view', 'menu:view', 'dept:view', 'log:view', 'role:add', 'menu:add', 'dept:add', 'user:export', 'role:export', 'menu:export', 'dept:export', 'log:export', 'monitor:loginlog', 'loginlog:export', 'others:eximport', 'gen:config', 'gen:generate', 'gen:generate:gen', 'client:view', 'client:add', 'client:decrypt', 'monitor:dashboard', 'others:datapermission', 'job:view', 'job:log:view', 'job:add', 'job:export', 'job:log:export']
      console.log(permissions)
      store.commit('account/setPermissions', permissions)
      asyncRouter = [
        {
          'path': '/system',
          'name': '系统管理',
          'component': 'Layout',
          'meta': {
            'title': '系统管理',
            'icon': 'el-icon-set-up',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/system/user',
              'name': '用户管理',
              'component': 'febs/system/user/Index',
              'meta': {
                'title': '用户管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/system/role',
              'name': '角色管理',
              'component': 'febs/system/role/Index',
              'meta': {
                'title': '角色管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/system/menu',
              'name': '菜单管理',
              'component': 'febs/system/menu/Index',
              'meta': {
                'title': '菜单管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/system/dept',
              'name': '部门管理',
              'component': 'febs/system/dept/Index',
              'meta': {
                'title': '部门管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/client',
              'name': '客户端管理',
              'component': 'febs/system/client/Index',
              'meta': {
                'title': '客户端管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '/monitor',
          'name': '系统监控',
          'component': 'Layout',
          'meta': {
            'title': '系统监控',
            'icon': 'el-icon-data-line',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/monitor/dashboard',
              'name': '监控面板',
              'component': 'febs/monitor/dashboard/Index',
              'meta': {
                'title': '监控面板',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/monitor/systemlog',
              'name': '系统日志',
              'component': 'febs/monitor/systemlog/Index',
              'meta': {
                'title': '系统日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/monitor/loginlog',
              'name': '登录日志',
              'component': 'febs/monitor/loginlog/Index',
              'meta': {
                'title': '登录日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '/route',
          'name': '网关管理',
          'component': 'Layout',
          'meta': {
            'title': '网关管理',
            'icon': 'el-icon-odometer',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/route/user',
              'name': '网关用户',
              'component': 'febs/route/routeuser/Index',
              'meta': {
                'title': '网关用户',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/route/log',
              'name': '网关日志',
              'component': 'febs/route/routelog/Index',
              'meta': {
                'title': '网关日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/route/ratelimitrule',
              'name': '限流规则',
              'component': 'febs/route/ratelimitrule/Index',
              'meta': {
                'title': '限流规则',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/route/ratelimitlog',
              'name': '限流日志',
              'component': 'febs/route/ratelimitlog/Index',
              'meta': {
                'title': '限流日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/route/blacklist',
              'name': '黑名单管理',
              'component': 'febs/route/blacklist/Index',
              'meta': {
                'title': '黑名单管理',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/route/blocklog',
              'name': '黑名单日志',
              'component': 'febs/route/blocklog/Index',
              'meta': {
                'title': '黑名单日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '/job',
          'name': '任务调度',
          'component': 'Layout',
          'meta': {
            'title': '任务调度',
            'icon': 'el-icon-alarm-clock',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/job/list',
              'name': '任务列表',
              'component': 'febs/job/job/Index',
              'meta': {
                'title': '任务列表',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/job/log',
              'name': '调度日志',
              'component': 'febs/job/log/Index',
              'meta': {
                'title': '调度日志',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '/others',
          'name': '其他模块',
          'component': 'Layout',
          'meta': {
            'title': '其他模块',
            'icon': 'el-icon-shopping-bag-1',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/others/eximport',
              'name': '导入导出',
              'component': 'febs/others/eximport/Index',
              'meta': {
                'title': '导入导出',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/others/blog',
              'name': '个人博客',
              'component': 'febs/others/blog/Index',
              'meta': {
                'title': '个人博客',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/others/datapermission',
              'name': '数据权限',
              'component': 'febs/others/datapermission/Index',
              'meta': {
                'title': '数据权限',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '/components',
          'name': '静态组件',
          'component': 'Layout',
          'meta': {
            'title': '静态组件',
            'icon': 'el-icon-present',
            'breadcrumb': true
          },
          'hidden': false,
          'alwaysShow': true,
          'children': [
            {
              'path': '/two',
              'name': '二级菜单',
              'component': 'demos/two/Index',
              'meta': {
                'title': '二级菜单',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': true,
              'children': [
                {
                  'path': '/three',
                  'name': '三级菜单',
                  'component': 'demos/two/three/Index',
                  'meta': {
                    'title': '三级菜单',
                    'icon': '',
                    'breadcrumb': true
                  },
                  'hidden': false,
                  'alwaysShow': false
                }
              ]
            },
            {
              'path': '/components/markdown',
              'name': 'MarkDown',
              'component': 'demos/markdown',
              'meta': {
                'title': 'MarkDown',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            },
            {
              'path': '/components/tinymce',
              'name': '富文本编辑器',
              'component': 'demos/tinymce',
              'meta': {
                'title': '富文本编辑器',
                'icon': '',
                'breadcrumb': true
              },
              'hidden': false,
              'alwaysShow': false
            }
          ]
        },
        {
          'path': '*',
          'name': '404',
          'component': 'error-page/404',
          'hidden': false,
          'alwaysShow': false
        }
      ]
      console.log(asyncRouter)
      store.commit('account/setRoutes', asyncRouter)
      save('USER_ROUTER', asyncRouter)
      go(to, next)
      // })
    //   } else {
    //     asyncRouter = userRouter
    //     go(to, next)
    //   }
    } else {
      next()
    }
    // } else {
    //   if (to.path === '/login') {
    //     next()
    //   } else {
    //     next('/login')
    //   }
    // }
  }
})

router.afterEach(() => {
  NProgress.done()
})

function go(to, next) {
  asyncRouter = filterAsyncRouter(asyncRouter)
  router.addRoutes(asyncRouter)
  next({ ...to, replace: true })
}

function save(name, data) {
  localStorage.setItem(name, JSON.stringify(data))
}

// function get(name) {
//   return JSON.parse(localStorage.getItem(name))
// }

function filterAsyncRouter(routes) {
  return routes.filter((route) => {
    const component = route.component
    if (component) {
      if (route.component === 'Layout') {
        route.component = Layout
      } else {
        route.component = view(component)
      }
      if (route.children && route.children.length) {
        route.children = filterAsyncRouter(route.children)
      }
      return true
    }
  })
}

function view(path) {
  return (resolve) => require([`@/views/${path}.vue`], resolve)
}

export default router
