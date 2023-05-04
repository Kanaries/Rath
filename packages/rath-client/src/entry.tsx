import { observer } from "mobx-react-lite";
// import { useEffect } from "react";
// import styled from "styled-components";
// import { useGlobalStore } from "./store";
// import WithAccessValidation from "./components/loginWidget";


// const Container = styled.div`
//     width: 100vw;
//     height: 100vh;
//     display: flex;
//     justify-content: center;
//     align-items: center;
// `;

const AppEntry = observer(function AppEntry ({ children }) {
    // Login system is disabled for now.

    // const { userStore } = useGlobalStore();
    
    // useEffect(() => {
    //     userStore.updateAuthStatus().then((res) => {
    //         if (res) {
    //             userStore.getPersonalInfo();
    //         }
    //     });
    // }, [userStore]);

    // return (
    //     <Container>
    //         <WithAccessValidation>
    //             {children}
    //         </WithAccessValidation>
    //     </Container>
    // );

    return (
        <>{children}</>
    );
});


export default AppEntry;
