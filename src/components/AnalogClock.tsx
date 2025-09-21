
import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path, Line, Defs, Marker, Polygon, G } from "react-native-svg";

const { width } = Dimensions.get('window');
const CLOCK_SIZE = width * 0.9;
const CENTER = CLOCK_SIZE / 2;

interface AnalogClockProps {
    clockInTime?: Date;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ clockInTime }) => {
    const hourRotation = useSharedValue(0);
    const minuteRotation = useSharedValue(0);
    const secondRotation = useSharedValue(0);

    // Calculate clock-in angles
    let clockInAngles = null;
    if (clockInTime) {
        const h = clockInTime.getHours();
        const m = clockInTime.getMinutes();
        const s = clockInTime.getSeconds();
        clockInAngles = {
            hour: ((h % 12) + m / 60) * 30,
            minute: m * 6 + s * 0.1,
            second: s * 6,
        };
    }

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const hourDeg = ((hours % 12) + minutes / 60) * 30;
            const minuteDeg = minutes * 6 + seconds * 0.1;
            const secondDeg = seconds * 6;

            hourRotation.value = withTiming(hourDeg, {
                duration: 500,
                easing: Easing.linear,
            });
            minuteRotation.value = withTiming(minuteDeg, {
                duration: 500,
                easing: Easing.linear,
            });
            secondRotation.value = withTiming(secondDeg, {
                duration: 500,
                easing: Easing.linear,
            });
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const renderTicks = () => {
        const ticks = [];
        for (let i = 1; i <= 60; i++) {
            const angle = (i * 6 * Math.PI) / 180; // Convert degrees to radians
            const outerR = CENTER - 5;
            const innerR = i % 5 === 0 ? outerR - 5 : outerR - 5;
            const x = CENTER + innerR * Math.sin(angle);
            const y = CENTER - innerR * Math.cos(angle);

            ticks.push(
                <View
                    key={i}
                    style={{
                        position: "absolute",
                        width: 1 % 5 === 0 ? 3 : 1,
                        height: i % 5 === 0 ? 12 : 6,
                        backgroundColor: i % 5 === 0 ? "#94a3b8" : "#64748B",
                        left: x,
                        top: y,
                        transform: [
                            { translateX: i % 5 === 0 ? -1.5 : -0.5 },
                            { translateY: -(i % 5 === 0 ? 12 : 6) / 2 },
                            { rotate: `${i * 6}deg` }
                        ],
                    }}
                />
            );
        }
        return ticks;
    };

    const renderNumbers = () => {
        const numbers = [];
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 * Math.PI) / 180; // Convert degrees to radians
            const r = CENTER - 30;
            const x = CENTER + r * Math.sin(angle);
            const y = CENTER - r * Math.cos(angle);

            numbers.push(
                <Text
                    key={i}
                    style={{
                        position: "absolute",
                        fontSize: 18,
                        color: "#e5e7eb",
                        fontWeight: "bold",
                        left: x - 10,
                        top: y - 11,
                    }}
                >
                    {i}
                </Text>
            );
        }
        return numbers;
    };

    const createHandStyle = (rotation: any, width: any, height: any, color: string, zIndex = 1) => useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${rotation.value}deg` }, { translateY: -height / 2 }],
        width,
        height,
        backgroundColor: color,
        position: "absolute",
        top: CENTER - height / 2,
        left: CENTER - width / 2,
        borderRadius: width / 2,
        zIndex,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 8,
    }));

    const hourStyle = createHandStyle(hourRotation, 8, CENTER * 0.45, "#fffffc");
    const minuteStyle = createHandStyle(minuteRotation, 5, CENTER * 0.7, "#fffffc");
    const secondStyle = createHandStyle(secondRotation, 2, CENTER * 0.9, "#ef4444", 5);

    // Draw arc for covered minutes since clock-in using react-native-svg
    const renderCoveredArc = () => {
        if (!clockInTime) return null;
        const now = new Date();
        const startMinute = clockInTime.getHours() * 60 + clockInTime.getMinutes();
        const endMinute = now.getHours() * 60 + now.getMinutes();
        let diff = endMinute - startMinute;
        if (diff < 0) diff += 1440; // handle overnight
        const startAngle = ((startMinute / 60) * 30) - 90;
        const endAngle = ((endMinute / 60) * 30) - 90;

        // Calculate arc path
        const r = CENTER - 10;
        const start = {
            x: CENTER + r * Math.cos((startAngle) * Math.PI / 180),
            y: CENTER + r * Math.sin((startAngle) * Math.PI / 180),
        };
        const end = {
            x: CENTER + r * Math.cos((endAngle) * Math.PI / 180),
            y: CENTER + r * Math.sin((endAngle) * Math.PI / 180),
        };
        const largeArcFlag = diff > 30 ? 1 : 0;
        const pathData = `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;

        return (
            <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} style={{ position: 'absolute', left: 0, top: 0 }}>
                <Path d={pathData} fill="#22d3ee55" />
            </Svg>
        );
    };

    // Draw arrow for clock-in time using react-native-svg
    const renderClockInArrow = () => {
        if (!clockInAngles) return null;
        const angleRad = (clockInAngles.minute - 90) * Math.PI / 180;
        const arrowLength = CENTER - 50;
        const x = CENTER + arrowLength * Math.cos(angleRad);
        const y = CENTER + arrowLength * Math.sin(angleRad);
        return (
            <View style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
                <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} style={{ position: 'absolute', left: 0, top: 0 }}>
                    <Defs>
                        <Marker id="arrowhead" markerWidth="8" markerHeight="5" refX="0" refY="4" orient="auto">
                            <Polygon points="0 0, 8 4, 0 8" fill="#22d3ee" />
                        </Marker>
                    </Defs>
                    <Line
                        x1={CENTER}
                        y1={CENTER}
                        x2={x}
                        y2={y}
                        stroke="#22d3ee"
                        strokeWidth={4}
                        markerEnd="url(#arrowhead)"
                    />
                </Svg>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.clockContainer}>
                <View style={styles.clock}>
                    {renderCoveredArc()}
                    {renderTicks()}
                    {renderNumbers()}
                    {renderClockInArrow()}
                    <View style={styles.centerDot} />
                    <Animated.View style={hourStyle} />
                    <Animated.View style={minuteStyle} />
                    <Animated.View style={secondStyle} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
    },
    clockContainer: {
        backgroundColor: "rgba(255,255,255,0.05)",
        width: CLOCK_SIZE + 20,
        height: CLOCK_SIZE + 20,
        borderRadius: (CLOCK_SIZE + 20) / 2,
        shadowColor: "#22d3ee",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    clock: {
        width: CLOCK_SIZE,
        height: CLOCK_SIZE,
        borderRadius: CLOCK_SIZE / 2,
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.08)",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    centerDot: {
        width: 16,
        height: 16,
        backgroundColor: "#f87171",
        borderRadius: 8,
        position: "absolute",
        top: CENTER - 8,
        left: CENTER - 8,
        zIndex: 10,
        borderColor: "#fff",
        borderWidth: 2,
    },

});

export default AnalogClock;
