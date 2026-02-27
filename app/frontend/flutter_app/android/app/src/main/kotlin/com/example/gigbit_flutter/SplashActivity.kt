package com.example.gigbit_flutter

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.graphics.Color
import android.view.WindowManager
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.TextView

class SplashActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
        window.statusBarColor = Color.TRANSPARENT
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        setContentView(R.layout.activity_splash)

        val title = findViewById<TextView>(R.id.splashTitle)
        val tagline = findViewById<TextView>(R.id.splashTagline)

        title.post {
            title.alpha = 1f
            title.pivotX = (title.width / 2f)
            title.pivotY = (title.height / 2f)
            title.scaleX = 1f
            title.scaleY = 0f
            title.animate()
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(840)
                .setStartDelay(120)
                .setInterpolator(DecelerateInterpolator(1.8f))
                .start()
        }

        tagline.post {
            tagline.alpha = 1f
            tagline.pivotX = (tagline.width / 2f)
            tagline.pivotY = (tagline.height / 2f)
            tagline.scaleX = 1f
            tagline.scaleY = 0f
            tagline.animate()
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(760)
                .setStartDelay(260)
                .setInterpolator(DecelerateInterpolator(1.7f))
                .start()
        }

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(R.anim.splash_popup_in, R.anim.splash_popup_out)
            finish()
        }, 1600)
    }
}
