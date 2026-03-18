import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PanResponder } from 'react-native';

import COLORS from '@/constants/colors';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 140;

export function SwipeableRow({ children, onDelete, onEdit }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const swiped = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const newVal = Math.min(0, Math.max(-ACTION_WIDTH, g.dx));
        translateX.setValue(newVal);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start();
          lastOffset.current = -ACTION_WIDTH;
          swiped.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          lastOffset.current = 0;
          swiped.current = false;
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    lastOffset.current = 0;
    swiped.current = false;
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
    onEdit();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    close();
    onDelete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.editAction} onPress={handleEdit}>
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.rowContent, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  editAction: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  rowContent: {
    backgroundColor: COLORS.bg,
  },
});
