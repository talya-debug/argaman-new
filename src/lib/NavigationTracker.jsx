import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// גרסה מצומצמת - ללא לוגים של base44
export default function NavigationTracker() {
    const location = useLocation();

    useEffect(() => {
        // ניתן להוסיף כאן לוגים ל-Firebase Analytics בעתיד
    }, [location]);

    return null;
}
