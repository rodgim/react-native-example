import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, StyleSheet, Button, Modal, Alert, PanResponder } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites
    }
};

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

class RenderDish extends Component{
    constructor(props){
        super(props);
    };

    handleViewRef = ref => this.view = ref;

    render(){
        const dish = this.props.dish;

        const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
            if(dx < -200){
                return true;
            }else{
                return false;
            }
        }

        const recognizeComment = ({ moveX, moveY, dx, dy }) => {
            if(dx > 200){
                return true;
            }else{
                return false;
            }
        }
        
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (e, gestureState) => {
                return true;
            },
            onPanResponderGrant: () => {
                this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
            },
            onPanResponderEnd: (e, gestureState) => {
                console.log("pan responder end", gestureState);
                if(recognizeDrag(gestureState)){
                    Alert.alert(
                        'Add Favorite',
                        'Are you sure you wish to add ' + dish.name + ' to favorite?',
                        [
                            {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                            {text: 'Ok', onPress: () => {this.props.favorite ? console.log('Already favorite') : this.props.onPress()}}
                        ],
                        {cancelable: false}
                    );
                }else if(recognizeComment(gestureState)){
                    this.props.showModal();
                }
                return true;
            }
        })
        if(dish != null){
            return(
                <Animatable.View animation="fadeInDown" duration={2000} delay={1000} ref={this.handleViewRef} {...panResponder.panHandlers}>
                    <Card
                    featuredTitle={dish.name}
                    image={{uri: baseUrl + dish.image}}>
                        <Text style={{margin: 10}}>
                            {dish.description}
                        </Text>
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "center"
                            }}>
                            <Icon 
                                raised
                                reverse
                                name={ this.props.favorite ? 'heart' : 'heart-o'}
                                type='font-awesome'
                                color='#f50'
                                onPress={() => this.props.favorite ? console.log('Already favorite') : this.props.onPress()}
                            />
                            <Icon 
                                raised
                                reverse
                                name='pencil'
                                type='font-awesome'
                                color='#512DA8'
                                onPress={() => this.props.showModal()}
                            />
                        </View>
                    </Card>
                </Animatable.View>
            );
        }else{
            return(<View></View>);
        }
    }
}

function RenderComments(props){
    const comments = props.comments;

    const renderCommentItem = ({item, index}) => {
        return(
            <View key={index} style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.comment}</Text>
                <Text style={{fontSize: 12}}>{item.rating} Starts</Text>
                <Text style={{fontSize: 12}}>{'-- ' + item.author + ', ' + item.date} </Text>
            </View>
        );
    };

    return(
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
            <Card title='Comments'>
                <FlatList 
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()}
                />
            </Card>
        </Animatable.View>
    );
}

class Dishdetail extends Component{
    constructor(props){
        super(props);
        this.state = {
            favorites: [],
            showModal: false,
            rating: 0,
            author: '',
            comment: '',
            dishId: 0
        };
    }

    static navigationOptions = {
        title: 'Dish Details'
    };

    toggleModal(){
        this.setState({showModal: !this.state.showModal});
    }

    markFavorite(dishId){
        this.props.postFavorite(dishId);
    }

    handleComment = (dishId) => {
        this.props.postComment(dishId, this.state.rating, this.state.author, this.state.comment);
    }

    ratingCompleted = (ratingValue) => {
        this.setState({
            rating: ratingValue
        });
    }

    render(){
        const dishId = this.props.navigation.getParam('dishId','');
        return(
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]} 
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)}
                    showModal={() => this.toggleModal()}/>
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
                <Modal
                    animationType={"slide"} transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => this.toggleModal()}
                    onRequestClose={() => this.toggleModal()}>
                    <View style={styles.modal}>
                        <Rating 
                            ratingCount={5}
                            showRating
                            onFinishRating={this.ratingCompleted}
                            />
                        <Input 
                            placeholder='Author'
                            leftIconContainerStyle={{
                                padding: 5
                            }}
                            leftIcon={{
                                type:'font-awesome',
                                name:'user'
                            }}
                            onChangeText={value => this.setState({author: value})}
                        />
                        <Input 
                            placeholder='Comment'
                            leftIconContainerStyle={{
                                padding: 5
                            }}
                            leftIcon={{
                                type:'font-awesome',
                                name:'comment'
                            }}
                            onChangeText={value => this.setState({comment: value})}
                        />
                        <Button 
                            buttonStyle={{
                                marginBottom: 10
                            }}
                            onPress={() => {this.toggleModal(); this.handleComment(dishId);}}
                            color="#512DA8"
                            title="Submit"/>

                        <View style={{
                            margin: 10,
                            backgroundColor: 'white'
                        }} />
                        <Button 
                            onPress={() => {this.toggleModal();}}
                            color="#C0C0C0"
                            title="Cancel"/>
                    </View>
                </Modal>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        margin: 20
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20
    },
    modalText: {
        fontSize: 18,
        margin: 10
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);