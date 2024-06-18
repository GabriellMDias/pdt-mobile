import React, { useState, useRef, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Animated, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Image } from 'react-native';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import Menu from '@/components/Menu';
import { screensConfig } from '@/constants/ScreensConfig';
import { AntDesign } from '@expo/vector-icons';
import { db } from '@/database/database-connection';
import synchronize from '@/app/config/sync'
import ModalMessage from '@/components/ModalMessage';

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [favoriteScreensIds, setFavoriteScreensIds] = useState<number[]>()
  const [conProps, setConProps] = useState<ConProps | null>(null)
  const [syncModal, setSyncModal] = useState<boolean>(false)
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const getFavorites =  () => {
    const sqlFavoritesQuery = 'SELECT id_screen FROM favoritos;'
    const favoritesRes = db.getAllSync<{id_screen: number}>(sqlFavoritesQuery, [])
    setFavoriteScreensIds(favoritesRes.map((item) => item.id_screen))
  }

  const getUserData = () => {
    const conPropsQuery = `SELECT * FROM conprops;`
    const conPropsRes = db.getFirstSync<ConProps>(conPropsQuery, [])
    setConProps(conPropsRes)

  }

  const handleSync = async () => {
    if(conProps !== null) {
      setSyncModal(true)
      try {
        await synchronize(conProps?.ipint, conProps?.portint, conProps?.ipext, conProps?.portext, conProps?.id_currentstore)
      } catch (error) {
        console.log(error)
      } finally {
        setSyncModal(false)
      }
      getUserData()
    }
  }

  useFocusEffect(
    useCallback(
        getFavorites
    , [])
  )

  useFocusEffect(
    useCallback(
        getUserData
    , [])
  )


  const toggleDrawer = (closeOnly = false) => {
    if (closeOnly){
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setIsDrawerOpen(false);
    } else {
      Animated.timing(drawerAnim, {
        toValue: isDrawerOpen ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setIsDrawerOpen(!isDrawerOpen);
    }
  };

  const navigateTo = (route: string) => {
    if(isDrawerOpen) {
      toggleDrawer(true)
    } else {
      router.navigate(route)
    }
  }

  if(favoriteScreensIds === undefined) return (
    <View style={styles.loading}>
        <ActivityIndicator size="large" color="#095E4A"/>
    </View>
  )

  return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Home',
            headerTitle: 'PdT Mobile',
            headerLeft: () => (
              <TouchableOpacity onPress={() => toggleDrawer()}>
                <Entypo name="menu" size={30} color="white" />
              </TouchableOpacity>  
            ),
          }}
        />
          
        {/*Drawer*/}
        <Animated.View style={[styles.drawer, {
          left: drawerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['-100%', '0%'],
          })
        }]}>
          <View style={styles.drawerHeaderContent}>
            <View style={styles.drawerLink}>
              <TouchableOpacity onPress={() => router.navigate('/config')}>
                <Ionicons name="settings-sharp" size={35} color="#888888" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.drawerText}>Dispositivo: {conProps?.devicename}</Text>
            <Text style={styles.drawerText}>Loja Selecionada: {conProps?.id_currentstore}</Text>
            <Text style={styles.drawerText}>Última sincronização: {conProps !== null 
                        ? (new Date(conProps.lastsync)).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ""}
            </Text> 
          </View>
          <View>
            <TouchableOpacity style={styles.drawerButton} onPress={handleSync}>
              <AntDesign name="sync" size={30} color="#888888"/>
              <Text style={styles.drawerText}>Sincronizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerButton} onPress={() => router.navigate('/cleardata')}>
              <AntDesign name="delete" size={30} color="#888888"/>
              <Text style={styles.drawerText}>Limpar Dados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerButton} onPress={() => router.navigate('/favorites')}>
              <AntDesign name="star" size={30} color="#888888"/>
              <Text style={styles.drawerText}>Editar Favoritos</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/*Favorites*/}
        <TouchableWithoutFeedback onPress={() => toggleDrawer(true)}> 
          <View style={styles.mainContent}>
            <View style={{width: '100%', backgroundColor: '#373737', flexDirection: 'row', position: 'absolute', top: 0}}>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  {favoriteScreensIds.map((screenId, index) => {return (
                    <TouchableOpacity key={index} onPress={() => navigateTo(screensConfig[2].screens.filter((item) => item.id === screenId)[0]?.route)}>
                      <View style={styles.favoriteItem}>
                        <View style={styles.favoriteItemIcon}>
                          {screensConfig.flatMap(group => group.screens).filter((item) => item.id === screenId)[0]?.icon(40, '#888888')}
                        </View>
                        <Text style={styles.favoriteText}>{screensConfig[2].screens.filter((item) => item.id === screenId)[0]?.name.toUpperCase()}</Text>
                      </View>
                    </TouchableOpacity>
                  )})}
                  <TouchableOpacity onPress={() => navigateTo('/favorites')}>
                    <View style={styles.favoriteItem}>
                      <View style={styles.favoriteItemAdd}>
                        <AntDesign name="plus" size={40} color="#444444" />
                      </View>
                    </View>
                  </TouchableOpacity>
              </ScrollView>
            </View>

            <Image source={require("@/assets/images/pdt-logo-gray.png")}/>
          </View> 
        </TouchableWithoutFeedback>

        <Menu selectedScreenId={1} />

        <ModalMessage 
          modalVisible={syncModal} 
          setModalVisible={setSyncModal} 
          hasOKButton={false} 
          title='Sincronizando...'
          text='Sincronizando dados, aguarde!'
          icon={<MaterialIcons name="phonelink-ring" size={50} color="black" />}/> 
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  favoriteItem: {
    width: 80,
    margin: 10
  },
  favoriteItemIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#888888',
  },
  favoriteItemAdd: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#444444',
  },
  favoriteText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 10
  },
  drawer: {
    position: 'absolute',
    backgroundColor: '#EEEEEE',
    top: 0,
    width: '75%',
    bottom: 0,
    zIndex: 100,
  },
  drawerHeaderContent: {
    padding: 2,
    borderBottomColor: '#888888',
    borderBottomWidth: 1,
  },
  drawerLink: {
    padding: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  drawerText: {
    marginLeft: 5,
    paddingBottom: 5,
    color: "#888888",
    fontWeight: 'bold'
  },
  drawerButton: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 15
  },
  mainContent: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  }
});
