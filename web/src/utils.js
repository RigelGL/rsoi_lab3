export function parseJwt(token) {
    try {
        return JSON.parse(atob(token?.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
        console.log(e);
        return {};
    }
}

export default { parseJwt };