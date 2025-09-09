
import React, { useEffect, useState } from 'react';
import { googleOAuth } from '@/api/functions';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthGoogleCallback() {
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');

    useEffect(() => {
        const processAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');

            if (!code) {
                setError('קוד אימות לא נמצא. אנא נסה שוב.');
                setStatus('error');
                return;
            }

            try {
                const response = await googleOAuth({
                    action: 'exchange_code',
                    code: code,
                    state: state
                });

                if (response.data && response.data.success) {
                    setStatus('success');
                    // שלח הודעה לחלון הראשי שההתחברות הצליחה
                    if (window.opener) {
                        window.opener.postMessage({ type: 'oauth_complete', status: 'success' }, '*');
                    }
                    // סגור את החלון אחרי הצלחה
                    setTimeout(() => window.close(), 1500);
                } else {
                    throw new Error(response.data.message || 'החלפת הקוד נכשלה.');
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                setError(err.message);
                setStatus('error');
                if (window.opener) {
                    window.opener.postMessage({ type: 'oauth_complete', status: 'error', error: err.message }, '*');
                }
            }
        };

        processAuth();
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <h1 className="text-2xl font-bold mt-4">מאמת את החיבור...</h1>
                        <p>זה ייקח רק רגע.</p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <h1 className="text-2xl font-bold mt-4 text-green-800">החיבור הושלם בהצלחה! ✅</h1>
                        <p className="text-green-600">החלון נסגר אוטומטית בעוד רגע...</p>
                        <p className="text-sm text-gray-500 mt-2">אם החלון לא נסגר, תוכל לסגור אותו ידנית</p>
                    </>
                );
            case 'error':
                return (
                    <>
                        <XCircle className="w-12 h-12 text-red-500" />
                        <h1 className="text-2xl font-bold mt-4">אירעה שגיאה</h1>
                        <p className="text-gray-600">{error}</p>
                        <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                            סגור
                        </button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
            {renderContent()}
        </div>
    );
}
