import type {SidebarView} from './sidebarNav';

export type ExplorerSearchScope = {
    sidebar: true
    routesOverview: boolean
};

/** Text search updates the nav list; the routes page only when that view is open. */
export function explorerSearchScope(view: SidebarView): ExplorerSearchScope {

    return {
        sidebar: true,
        routesOverview: view.kind === 'routes',
    };

}
