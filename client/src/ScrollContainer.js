import * as React from "react";
import {OverlayScrollbarsComponent} from "overlayscrollbars-react";

const ScrollContainer = ({className, children}) => {
    return (
        <OverlayScrollbarsComponent className={"os-theme-dark " + className}
                                    /*options={{scrollbars: {autoHide: "scroll" }}}*/>
            {children}
        </OverlayScrollbarsComponent>
    );
};

export default ScrollContainer;
