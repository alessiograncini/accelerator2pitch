/**
 * AccelerationToRate.ts
 * 
 * Maps acceleration and velocity from AccelerationCalculator to playback rate 
 * changes in AudioController. Allows real-time control of audio pitch/speed
 * based on object movement with tunable parameters for optimal feel.
 */

import { AccelerationCalculator } from "./AccelerationCalculator";
import { AudioController } from "./AudioController";

@component
export class AccelerationToRate extends BaseScriptComponent {
    @input
    @hint("AccelerationCalculator component to read motion data from")
    accelerationCalculator: AccelerationCalculator;

    @input
    @hint("AudioController component to modify rate on")
    audioController: AudioController;

    @input
    @hint("Base playback rate when not moving")
    @widget(new SliderWidget(0.1, 3.0, 1.0))
    baseRate: number = 1.0;

    @input
    @hint("Use velocity instead of acceleration for rate control")
    useVelocity: boolean = true;

    @input
    @hint("Sensitivity - how much motion affects rate")
    @widget(new SliderWidget(0.1, 10.0, 1.0))
    sensitivity: number = 2.0;

    @input
    @hint("Minimum playback rate (slowest)")
    @widget(new SliderWidget(0.1, 1.0, 0.3))
    minRate: number = 0.3;

    @input
    @hint("Maximum playback rate (fastest)")
    @widget(new SliderWidget(1.0, 5.0, 3.0))
    maxRate: number = 3.0;

    @input
    @hint("Smoothing factor for rate changes (0 = instant, 0.9 = very smooth)")
    @widget(new SliderWidget(0.0, 0.95, 0.7))
    smoothing: number = 0.7;

    @input
    @hint("Motion threshold - minimum motion to trigger rate changes")
    @widget(new SliderWidget(0.0, 1.0, 0.05))
    motionThreshold: number = 0.05;

    @input
    @hint("Enable debug logging")
    enableDebugLogging: boolean = false;

    // Private variables for rate calculation
    private currentRate: number = 1.0;
    private targetRate: number = 1.0;

    onAwake(): void {
        if (!this.accelerationCalculator) {
            print("AccelerationToRate: ERROR - No AccelerationCalculator specified!");
            return;
        }

        if (!this.audioController) {
            print("AccelerationToRate: ERROR - No AudioController specified!");
            return;
        }

        print("AccelerationToRate: Initializing...");
        
        // Initialize rates
        this.currentRate = this.baseRate;
        this.targetRate = this.baseRate;
        this.audioController.rate = this.baseRate;

        // Bind update event for real-time rate control
        this.createEvent("UpdateEvent").bind(() => {
            this.updateRate();
        });

        print("AccelerationToRate: Initialization complete");
        print("AccelerationToRate: Using " + (this.useVelocity ? "velocity" : "acceleration") + " for rate control");
        print("AccelerationToRate: Sensitivity: " + this.sensitivity);
        print("AccelerationToRate: Rate range: " + this.minRate + " to " + this.maxRate);
    }

    private updateRate(): void {
        // Get motion data from AccelerationCalculator
        const motionMagnitude = this.useVelocity ? 
            this.accelerationCalculator.velocityMagnitude : 
            this.accelerationCalculator.accelerationMagnitude;

        // Check if motion is above threshold
        if (motionMagnitude < this.motionThreshold) {
            // Not enough motion - return to base rate
            this.targetRate = this.baseRate;
        } else {
            // Calculate target rate based on motion
            this.targetRate = this.calculateTargetRate(motionMagnitude);
        }

        // Apply smoothing to rate changes
        this.currentRate = this.applySmoothingToRate(this.currentRate, this.targetRate);

        // Clamp rate to valid range
        this.currentRate = Math.max(this.minRate, Math.min(this.maxRate, this.currentRate));

        // Apply rate to AudioController
        this.audioController.rate = this.currentRate;

        // Debug logging
        if (this.enableDebugLogging) {
            this.logDebugInfo(motionMagnitude);
        }
    }

    private calculateTargetRate(motionMagnitude: number): number {
        // Map motion magnitude to rate change
        // Higher motion = higher rate (faster playback)
        const rateMultiplier = 1.0 + (motionMagnitude * this.sensitivity);
        const targetRate = this.baseRate * rateMultiplier;

        return targetRate;
    }

    private applySmoothingToRate(currentRate: number, targetRate: number): number {
        // Exponential moving average for smooth rate transitions
        const alpha = this.smoothing;
        const oneMinusAlpha = 1.0 - alpha;
        
        return oneMinusAlpha * targetRate + alpha * currentRate;
    }

    private logDebugInfo(motionMagnitude: number): void {
        print("AccelerationToRate: [DEBUG] === RATE CONTROL DEBUG ===");
        print("AccelerationToRate: [DEBUG] Motion Magnitude: " + motionMagnitude.toFixed(6));
        print("AccelerationToRate: [DEBUG] Motion Type: " + (this.useVelocity ? "velocity" : "acceleration"));
        print("AccelerationToRate: [DEBUG] Above Threshold: " + (motionMagnitude >= this.motionThreshold));
        print("AccelerationToRate: [DEBUG] Target Rate: " + this.targetRate.toFixed(4));
        print("AccelerationToRate: [DEBUG] Current Rate: " + this.currentRate.toFixed(4));
        print("AccelerationToRate: [DEBUG] Applied Rate: " + this.audioController.rate.toFixed(4));
        print("AccelerationToRate: [DEBUG] Base Rate: " + this.baseRate);
        print("AccelerationToRate: [DEBUG] Sensitivity: " + this.sensitivity);
        print("AccelerationToRate: [DEBUG] === END DEBUG ===");
    }

    /**
     * Reset rate to base value
     */
    public resetRate(): void {
        this.currentRate = this.baseRate;
        this.targetRate = this.baseRate;
        this.audioController.rate = this.baseRate;
        print("AccelerationToRate: Rate reset to base: " + this.baseRate);
    }

    /**
     * Enable/disable motion-based rate control
     */
    public setEnabled(enabled: boolean): void {
        if (!enabled) {
            this.resetRate();
        }
        this.enabled = enabled;
        print("AccelerationToRate: Motion control " + (enabled ? "enabled" : "disabled"));
    }

    /**
     * Get current rate being applied
     */
    public getCurrentRate(): number {
        return this.currentRate;
    }

    /**
     * Get target rate (before smoothing)
     */
    public getTargetRate(): number {
        return this.targetRate;
    }
} 