package com.cloudvault.app;

import android.app.Dialog;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private Dialog authDialog;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            // Tối ưu User-Agent: Loại bỏ '; wv' và 'Version/4.0' để Google không chặn OAuth (403 disallowed_useragent)
            String userAgent = settings.getUserAgentString();
            if (userAgent != null) {
                String cleanUa = userAgent.replace("; wv", "").replace("Version/4.0 ", "");
                settings.setUserAgentString(cleanUa);
            }

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // Giữ toàn bộ tính năng gốc của Capacitor (Upload file, Quyền hạn...) đồng thời hỗ trợ Popup Google Login nội bộ
            webView.setWebChromeClient(new BridgeWebChromeClient(bridge) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView popupWebView = new WebView(MainActivity.this);
                    WebSettings popupSettings = popupWebView.getSettings();
                    popupSettings.setJavaScriptEnabled(true);
                    popupSettings.setDomStorageEnabled(true);
                    popupSettings.setDatabaseEnabled(true);
                    popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                    popupSettings.setSupportMultipleWindows(true);

                    // Sử dụng cùng User-Agent chuẩn
                    if (settings.getUserAgentString() != null) {
                        popupSettings.setUserAgentString(settings.getUserAgentString());
                    }

                    // Cho phép cookie bên thứ 3 trên popup
                    CookieManager.getInstance().setAcceptCookie(true);
                    CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                    // Hiển thị Dialog toàn màn hình chứa cửa sổ đăng nhập Google
                    if (authDialog != null && authDialog.isShowing()) {
                        try {
                            authDialog.dismiss();
                        } catch (Exception ignored) {}
                    }
                    authDialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    authDialog.setContentView(popupWebView);
                    if (authDialog.getWindow() != null) {
                        authDialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                    }

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            if (authDialog != null && authDialog.isShowing()) {
                                try {
                                    authDialog.dismiss();
                                } catch (Exception ignored) {}
                            }
                            window.destroy();
                        }
                    });

                    popupWebView.setWebViewClient(new WebViewClient());

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(popupWebView);
                    resultMsg.sendToTarget();

                    authDialog.show();
                    return true;
                }

                @Override
                public void onCloseWindow(WebView window) {
                    if (authDialog != null && authDialog.isShowing()) {
                        try {
                            authDialog.dismiss();
                        } catch (Exception ignored) {}
                    }
                    super.onCloseWindow(window);
                }
            });
        }
    }
}
