import React from 'react';
import {FlatList, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import {GestureHandlerRootView, Swipeable} from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

interface props {
    data: any,
    content: {
      label: string, 
      field: string,
      dataType: "text" | "localeString"}[],
    style: StyleProp<ViewStyle>,
    onDelete: (id: number) => void,
    onPressRoute?: string
}

export const TransmissionList = ({data, content, style, onDelete, onPressRoute}: props) => {

  const onPress = (id: number) => {
    if(onPressRoute !== undefined) {
      console.log(`${onPressRoute}/${id}`)
      router.navigate(`${onPressRoute}/${id}`)
    }
  }

  const renderLeftActions = () => {
    return (
      <View style={styles.swipedRow}>
        <AntDesign name="delete" size={40} color="white" />
      </View>
    );
  };
  
  const Item = ({dataItem}: {dataItem: any}) => (
    <GestureHandlerRootView>
      <Swipeable 
        renderLeftActions={renderLeftActions} 
        containerStyle={{marginBottom: 10}} 
        onSwipeableOpen={() => onDelete(dataItem.id)}
        >
          <TouchableOpacity onPress={() => onPress(dataItem.id)} activeOpacity={1}>
            <View style={[styles.outerContainer]}>
                <View style={styles.removeBackground}>
                    <AntDesign name="delete" size={40} color="white" />
                </View>
                    <View style={[styles.innerContainer]}>
                      <View style={styles.itemDataContainer}>
                        {content.map((Item, index) => {
                            let valueToShow;
                            if (Item.dataType === "text") {
                                valueToShow = dataItem[Item.field];
                            } else {
                                valueToShow = dataItem[Item.field].toLocaleString('pt-br');
                            }

                            return (
                                <Text style={styles.textGray} key={index}>
                                    {Item.label}
                                    <Text style={styles.textWhite}>
                                        {valueToShow}
                                    </Text>
                                </Text>
                            );
                        })}
                      </View>
                        {dataItem.transmitido === 1 ? (
                              <View style={[styles.transmissionStatusContainer, { backgroundColor: 'green' }]}>
                                  <AntDesign name="checkcircle" size={40} color="white" />
                                  <Text style={styles.textWhite}>Transmitido</Text>
                              </View>
                          ) : dataItem.transmitido === 0 ? (
                              <View style={[styles.transmissionStatusContainer, { backgroundColor: '#FE0000' }]}>
                                  <AntDesign name="closecircle" size={40} color="white" />
                                  <Text style={styles.textWhite}>Não Transmitido</Text>
                              </View>
                          ) : (
                            <View style={[styles.transmissionStatusContainer, { backgroundColor: '#FFCB2F' }]}>
                                <AntDesign name="minuscircle" size={40} color="white" />
                                <Text style={styles.textWhite}>Parcialmente Transmitido</Text>
                            </View>
                          )}
                    </View>
            </View>
          </TouchableOpacity>
          
      </Swipeable>
    </GestureHandlerRootView>
  );

  const renderItem = (dataItem: any) => (
    <Item dataItem={dataItem} />
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={data}
        renderItem={i => renderItem(i.item)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingLeft: 5,
    backgroundColor: '#373737',
    marginBottom: 15
  },
  swipedRow: {
    height: 150,
    width: 352,
    backgroundColor: 'red',
    justifyContent: 'center',
    paddingLeft: 15,
    borderRadius: 10
  },
  swipedConfirmationContainer: {
    flex: 1,
  },
  deleteConfirmationText: {
    color: '#fcfcfc',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#b60000',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  deleteButtonText: {
    color: '#fcfcfc',
    fontWeight: 'bold',
    padding: 3,
  },
  outerContainer: {
    height: 150,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: 'black',
    borderWidth: 1
},
innerContainer: {
    height: 150,
    flexDirection: 'row'
},
removeBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: 'red',
    justifyContent: 'center',
    paddingLeft: 15
},
itemDataContainer: {
    flex: 5,
    backgroundColor: '#373737',
    justifyContent: 'center',
    paddingLeft: 10
},
transmissionStatusContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center'
},
textWhite: {
    fontSize: 10,
    flexWrap: "wrap",
    color: 'white'
},
textGray: {
    fontSize: 10,
    flexWrap: "wrap",
    color: '#909090'
},
});