/**
 * AccelerationCalculator.ts
 * 
 * Utility class for calculating velocity and acceleration of a SceneObject
 * based on position changes over time. Provides smoothed values to avoid
 * jittery calculations from frame-to-frame variations.
 */

@component
export class AccelerationCalculator extends BaseScriptComponent {
    @input
    @hint("The object to track for acceleration calculations")
    targetObject: SceneObject;

    @input
    @hint("Smoothing factor for velocity calculations (0.0 = no smoothing, 0.9 = heavy smoothing)")
    @widget(new SliderWidget(0.0, 0.95, 0.01))
    smoothingFactor: number = 0.7;

    @input
    @hint("Minimum velocity threshold to register movement")
    velocityThreshold: number = 0.01;

    @input
    @hint("Enable debug logging of calculated values")
    enableDebugLogging: boolean = false;

    // Private properties for calculations
    private previousPosition: vec3 | null = null;
    private previousVelocity: vec3 = vec3.zero();
    private currentVelocity: vec3 = vec3.zero();
    private smoothedVelocity: vec3 = vec3.zero();
    private acceleration: vec3 = vec3.zero();
    private previousTime: number = 0;

    // Public getters for external access
    public get velocity(): vec3 {
        return this.smoothedVelocity;
    }

    public get velocityMagnitude(): number {
        return this.smoothedVelocity.length;
    }

    public get accelerationVector(): vec3 {
        return this.acceleration;
    }

    public get accelerationMagnitude(): number {
        return this.acceleration.length;
    }

    public get isMoving(): boolean {
        return this.velocityMagnitude > this.velocityThreshold;
    }

    onAwake(): void {
        if (!this.targetObject) {
            print("AccelerationCalculator: ERROR - No target object specified!");
            return;
        }

        print("AccelerationCalculator: Initializing...");
        this.previousTime = getTime();
        this.previousPosition = this.targetObject.getTransform().getWorldPosition();
        
        print("AccelerationCalculator: Initial position: " + this.previousPosition.toString());
        print("AccelerationCalculator: Initial time: " + this.previousTime.toFixed(3));
        
        // Initialize all vectors
        this.previousVelocity = vec3.zero();
        this.currentVelocity = vec3.zero();
        this.smoothedVelocity = vec3.zero();
        this.acceleration = vec3.zero();
        
        print("AccelerationCalculator: Initialization complete");
        print("AccelerationCalculator: Velocity threshold: " + this.velocityThreshold);
        print("AccelerationCalculator: Smoothing factor: " + this.smoothingFactor);

        // Bind the update event - this is the correct pattern!
        this.createEvent("UpdateEvent").bind(() => {
            this.updateCalculations();
        });
        
        print("AccelerationCalculator: UpdateEvent bound successfully!");
    }

    private updateCalculations(): void {
        if (!this.targetObject) {
            print("AccelerationCalculator: WARNING - No target object in updateCalculations");
            return;
        }

        this.calculateMotionValues();

        // Always log basic values so you can see what's happening
        print("AccelerationCalculator: Velocity Mag: " + this.velocityMagnitude.toFixed(5) + 
              " | Accel Mag: " + this.accelerationMagnitude.toFixed(5) + 
              " | Moving: " + this.isMoving);

        if (this.enableDebugLogging) {
            this.logDebugInfo();
        }
    }

    private calculateMotionValues(): void {
        const currentTime = getTime();
        const currentPosition = this.targetObject.getTransform().getWorldPosition();
        const deltaTime = currentTime - this.previousTime;

        print("AccelerationCalculator: [CALC] DeltaTime: " + deltaTime.toFixed(6) + "s");
        print("AccelerationCalculator: [CALC] Current Pos: " + currentPosition.toString());

        // Avoid division by zero
        if (deltaTime <= 0) {
            print("AccelerationCalculator: [CALC] Skipping - deltaTime too small: " + deltaTime);
            return;
        }

        // Calculate raw velocity
        if (this.previousPosition) {
            const positionDelta = currentPosition.sub(this.previousPosition);
            print("AccelerationCalculator: [CALC] Position Delta: " + positionDelta.toString());
            print("AccelerationCalculator: [CALC] Position Delta Magnitude: " + positionDelta.length.toFixed(6));
            
            this.currentVelocity = positionDelta.uniformScale(1.0 / deltaTime);
            print("AccelerationCalculator: [CALC] Raw Velocity: " + this.currentVelocity.toString());
            print("AccelerationCalculator: [CALC] Raw Velocity Magnitude: " + this.currentVelocity.length.toFixed(6));
        } else {
            print("AccelerationCalculator: [CALC] No previous position - first frame");
        }

        // Apply smoothing to velocity
        const previousSmoothedVel = this.smoothedVelocity;
        this.smoothedVelocity = this.applySmoothing(this.smoothedVelocity, this.currentVelocity);
        print("AccelerationCalculator: [CALC] Smoothed Velocity: " + this.smoothedVelocity.toString());
        print("AccelerationCalculator: [CALC] Smoothed Velocity Magnitude: " + this.smoothedVelocity.length.toFixed(6));

        // Calculate acceleration from velocity change
        const velocityDelta = this.smoothedVelocity.sub(this.previousVelocity);
        print("AccelerationCalculator: [CALC] Velocity Delta: " + velocityDelta.toString());
        print("AccelerationCalculator: [CALC] Velocity Delta Magnitude: " + velocityDelta.length.toFixed(6));
        
        this.acceleration = velocityDelta.uniformScale(1.0 / deltaTime);
        print("AccelerationCalculator: [CALC] Final Acceleration: " + this.acceleration.toString());
        print("AccelerationCalculator: [CALC] Final Acceleration Magnitude: " + this.acceleration.length.toFixed(6));

        // Update previous values for next frame
        this.previousPosition = currentPosition;
        this.previousVelocity = this.smoothedVelocity;
        this.previousTime = currentTime;
        
        print("AccelerationCalculator: [CALC] --- Frame Complete ---");
    }

    private applySmoothing(previousValue: vec3, currentValue: vec3): vec3 {
        // Exponential moving average: smoothed = (1 - alpha) * current + alpha * previous
        const alpha = this.smoothingFactor;
        const oneMinusAlpha = 1.0 - alpha;
        
        print("AccelerationCalculator: [SMOOTH] Alpha: " + alpha.toFixed(3) + " | OneMinusAlpha: " + oneMinusAlpha.toFixed(3));
        print("AccelerationCalculator: [SMOOTH] Previous: " + previousValue.toString());
        print("AccelerationCalculator: [SMOOTH] Current: " + currentValue.toString());
        
        const smoothed = new vec3(
            oneMinusAlpha * currentValue.x + alpha * previousValue.x,
            oneMinusAlpha * currentValue.y + alpha * previousValue.y,
            oneMinusAlpha * currentValue.z + alpha * previousValue.z
        );
        
        print("AccelerationCalculator: [SMOOTH] Result: " + smoothed.toString());
        return smoothed;
    }

    private logDebugInfo(): void {
        const pos = this.targetObject.getTransform().getWorldPosition();
        print("AccelerationCalculator: [DEBUG] === DETAILED DEBUG INFO ===");
        print("AccelerationCalculator: [DEBUG] Position: (" + pos.x.toFixed(4) + ", " + pos.y.toFixed(4) + ", " + pos.z.toFixed(4) + ")");
        print("AccelerationCalculator: [DEBUG] Raw Velocity: " + this.currentVelocity.toString());
        print("AccelerationCalculator: [DEBUG] Smoothed Velocity: " + this.smoothedVelocity.toString());
        print("AccelerationCalculator: [DEBUG] Velocity Magnitude: " + this.velocityMagnitude.toFixed(6) + " units/sec");
        print("AccelerationCalculator: [DEBUG] Acceleration Vector: " + this.acceleration.toString());
        print("AccelerationCalculator: [DEBUG] Acceleration Magnitude: " + this.accelerationMagnitude.toFixed(6) + " units/sec²");
        print("AccelerationCalculator: [DEBUG] Is Moving (above threshold): " + this.isMoving);
        print("AccelerationCalculator: [DEBUG] Velocity Threshold: " + this.velocityThreshold);
        print("AccelerationCalculator: [DEBUG] === END DEBUG INFO ===");
    }

    /**
     * Get the velocity component in a specific direction
     * @param direction Normalized direction vector
     * @returns Velocity magnitude in the specified direction
     */
    public getVelocityInDirection(direction: vec3): number {
        const normalizedDirection = direction.normalize();
        return this.smoothedVelocity.dot(normalizedDirection);
    }

    /**
     * Get the acceleration component in a specific direction
     * @param direction Normalized direction vector
     * @returns Acceleration magnitude in the specified direction
     */
    public getAccelerationInDirection(direction: vec3): number {
        const normalizedDirection = direction.normalize();
        return this.acceleration.dot(normalizedDirection);
    }

    /**
     * Reset all motion calculations
     */
    public reset(): void {
        this.previousPosition = null;
        this.previousVelocity = vec3.zero();
        this.currentVelocity = vec3.zero();
        this.smoothedVelocity = vec3.zero();
        this.acceleration = vec3.zero();
        this.previousTime = getTime();
        
        if (this.targetObject) {
            this.previousPosition = this.targetObject.getTransform().getWorldPosition();
        }
    }
}