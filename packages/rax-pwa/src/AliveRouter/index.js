import { createElement, Fragment, useState, useEffect } from 'rax';
import { isWeb, isNode } from 'universal-env';

import styles from './index.css';

let routerList = [];
let routerProps = {}; // todo
let maxSavePathNum;
let updateComponentTrigger = function() { };
let isFirstTimeRender = true;
const pages = {};

const activateComponent = (route) => {
  route.component()
    .then(fn => fn())
    .then((Page) => {
      pages[route.path] = createElement(Page, { s: 1 });
      if (Object.keys(pages).length > maxSavePathNum) {
        delete pages[Object.keys(pages)[0]];
      }
      updateComponentTrigger(Date.now());
    });
};

function AliveRouter(props) {
  const { routerConfig = {}, tabConfig = {}, aliveConfig = {}, useRouter } = props;

  const { history, routes = [] } = routerConfig;
  const { textColor = '#666', selectedColor = '#333', backgroundColor = '#fff', items = [] } = tabConfig;
  const { maxSavePath = 5, paths = [] } = aliveConfig;

  const [updateTemp, setUpdateTemp] = useState(null);

  const { Router } = useRouter(routerConfig);

  maxSavePathNum = maxSavePath;
  routerProps = props;
  routerList = routes;
  updateComponentTrigger = setUpdateTemp;

  useEffect(() => {
    history.listen(() => {
      updateComponentTrigger(Date.now());
    });
  }, []);


  if (isNode && routerConfig.InitialComponent) {
    return createElement(routerConfig.InitialComponent, props);
  }

  const pageWithTabBar = !!items.find(item => item.pagePath === history.location.pathname);

  if (isFirstTimeRender && routerConfig.InitialComponent) {
    isFirstTimeRender = false;
    const getInitialComponent = routerConfig.InitialComponent;
    if (!pageWithTabBar) {
      return createElement(getInitialComponent(), props);
    } else {
      pages[history.location.pathname] = createElement(getInitialComponent(), props);
      delete routerConfig.InitialComponent;
    }
  }

  return (
    <Fragment>
      {pageWithTabBar ? null : <Router />}

      <div style={{ ...styles.container, display: pageWithTabBar ? 'block' : 'none' }}>

        {items.map((item) => {
          const route = routes.find(it => it.path === item.pagePath);
          const pathMatched = route.regexp.test(history.location.pathname);
          const pageComponent = pages[route.path] || null;
          if (pathMatched && !pageComponent) activateComponent(route);
          return <div style={[styles.page, { display: pathMatched ? 'block' : 'none' }]}>{pageComponent}</div>;
        })}

        <div style={styles.tabBar}>
          {items.map((item) => {
            const currentPath = history.location.pathname;
            const selected = currentPath === item.pagePath;

            return (
              <div style={[styles.tabBarItem, { backgroundColor }]} onClick={() => {
                history.push(item.pagePath);
              }}>
                <img style={{ ...styles.tabBarItem_img, display: selected && item.activeIcon ? 'block' : 'none' }} src={item.activeIcon} />
                <img style={{ ...styles.tabBarItem_img, display: !selected && item.icon ? 'block' : 'none' }} src={item.icon} />
                <span style={[styles.tabBarItem_txt, { color: selected ? selectedColor : textColor }]}>{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Fragment>
  );
}


export default AliveRouter;
