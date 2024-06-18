import React from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { View, FlatList, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { screensConfig } from '@/constants/ScreensConfig';
import Menu from '@/components/Menu';
import { Ionicons } from '@expo/vector-icons';

export default function Page() {
  const { screenGroupId } = useLocalSearchParams<{ screenGroupId: string }>();

  const screenGroup = screensConfig.filter((screenGroup) => screenGroup.id === parseInt(screenGroupId ?? '1'));

  // Retorna a visualização adequada se o comprimento do array screenGroup for 1
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: screenGroup[0].name,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/home")}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>  
          ),
        }} />
      <FlatList
        style={{marginBottom: 50}}
        data={screenGroup[0].screens}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.screenItem} onPress={() => router.navigate(item.route)}>
            <View style={styles.screenItemInner}>
              {item.icon(40, '#095E4A')}
              <Text style={styles.screenName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
      />
      <Menu selectedScreenId={screenGroup[0].id}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenItem: {
    aspectRatio: 1.5,
    width: '46%',
    margin: '2%'
  },
  screenItemInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#282825',
    borderColor: '#888888',
    borderWidth: 0.5,
    borderRadius: 5,
  },
  screenName: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold'
  },
});
