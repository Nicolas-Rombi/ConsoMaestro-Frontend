import React, { useState, useEffect } from "react";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {View,Text,StyleSheet,TouchableOpacity,Image,Modal,ScrollView,} from "react-native";
import moment from "moment"; // Pour la manipulation des dates
import { useSelector } from "react-redux";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";


const FridgeScreen = () => {
  // Initialisation des hooks de navigation et de l'état
  const navigation = useNavigation();
  const userId = useSelector((state) => state.user.id); // Récupération de l'ID utilisateur depuis le store Redux
  const isFocused = useIsFocused(); // Vérifie si l'écran est en focus
  const [productsInfo, setProductsInfo] = useState(); // État pour stocker les informations des produits
  const [refresh, setRefresh] = useState(false); // État pour forcer le rafraîchissement des données
  const [shortDlcModalVisible, setShortDlcModalVisible] = useState(false); // Modal pour DLC courte
  const [longDlcModalVisible, setLongDlcModalVisible] = useState(false); // Modal pour DLC longue

  // Effet pour récupérer les produits lorsque l'écran est en focus ou que l'état de rafraîchissement change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`https://conso-maestro-backend.vercel.app/frigo/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.result) {
          console.log("data from ", data);
          setProductsInfo(data.data); // Met à jour l'état avec les informations des produits
        } else {
          console.error("Erreur lors de la récupération des produits:", data.message);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des produits:", error);
      }
    };

    fetchProducts();
  }, [isFocused, refresh]);

  // Navigation vers l'écran Placard
  const handlePlacardPress = () => {
    navigation.navigate("PlacardScreen");
  };

  // Navigation vers l'écran Congélateur
  const handleCongeloPress = () => {
    navigation.navigate("CongeloScreen");
  };

  // Fonction pour déterminer la couleur du conteneur en fonction de la date de DLC
  const handleDlcColor = (dlcDate) => {
    const today = moment();
    const expirationDate = moment(dlcDate);
    const daysRemaining = expirationDate.diff(today, "days");

    // Logique de couleur
    if (daysRemaining <= 2) {
      return styles.redDlcContainer; // Rouge si à 2 jours ou moins
    } else if (daysRemaining <= 4) {
      return styles.orangeDlcContainer; // Orange si entre 2 et 4 jours
    } else {
      return styles.greenDlcContainer; // Vert sinon
    }
  };

  // Fonction pour changer le lieu de stockage du produit
  const changementStoragePlace = async (data, newStoragePlace) => {
    try {
      const response = await fetch(`https://conso-maestro-backend.vercel.app/products/${data._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newStoragePlace: newStoragePlace,
        }),
      });
      const result = await response.json();
      if (result.result) {
        console.log("Produit mis à jour avec succès:", result.message);
      } else {
        console.error("Erreur lors de la mise à jour du produit:", result.message);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
    }
  };

  // Fonction pour gérer le clic sur l'image du produit
  const handleImageClick = async (data) => {
    let newStoragePlace;
    if (data.storagePlace === "Frigo") {
      newStoragePlace = "Congelo";
    } else if (data.storagePlace === "Congelo") {
      newStoragePlace = "Placard";
    } else if (data.storagePlace === "Placard") {
      newStoragePlace = "Frigo";
    }

    await changementStoragePlace(data, newStoragePlace);

    // Mise à jour de l'état local avec le nouveau lieu de stockage
    setProductsInfo((prevProductsInfo) =>
      prevProductsInfo.map((product) =>
        product._id === data._id
          ? { ...product, storagePlace: newStoragePlace }
          : product
      )
    );
  };

  // Fonction pour gérer l'affichage des modals en fonction de la DLC
  const handleDlcPress = (dlcDate) => {
    const today = moment();
    const expirationDate = moment(dlcDate);
    const daysRemaining = expirationDate.diff(today, "days");

    if (daysRemaining <= 4) {
      setShortDlcModalVisible(true);
    } else {
      setLongDlcModalVisible(true);
    }
  };

  // Fonction pour supprimer un produit
  const handleProductDelete = (data) => {
    fetch(`https://conso-maestro-backend.vercel.app/products/${data._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.result) {
          console.log("Produit supprimé avec succès :", result.message);
          // Met à jour l'état en filtrant le produit supprimé
          setProductsInfo((prevProductsInfo) =>
            prevProductsInfo.filter((product) => product._id !== data._id)
          );
          setRefresh((prev) => !prev); // Force le rafraîchissement
        } else {
          console.error("Erreur lors de la suppression du produit :", result.message);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression du produit :", error);
      });
  };

  // Rendu des produits
  const products = productsInfo
    ? productsInfo.map((data, i) => {
        const formattedDlc = new Date(data.dlc).toLocaleDateString();
        let imageSource;

        // Choix de l'image en fonction du lieu de stockage
        if (data.storagePlace === "Frigo") {
          imageSource = require('../assets/FRIGO.png');
        } else if (data.storagePlace === "Congelo") {
          imageSource = require('../assets/congelo.png');
        } else if (data.storagePlace === "Placard") {
          imageSource = require('../assets/Placard.png');
        }

        return (
          <View style={styles.ProductLineContainer} key={i}>
            <Text style={styles.ProductTitle}>{data.name}</Text>

            {/* Conteneur pour la date limite de consommation avec couleur dynamique */}
            <TouchableOpacity onPress={() => handleDlcPress(data.dlc)}>
              <View style={[styles.DlcContainer, handleDlcColor(data.dlc)]}>
                <Text style={styles.DlcText}>{formattedDlc}</Text>
              </View>
            </TouchableOpacity>

            {/* Bouton pour changer le lieu de stockage */}
            <View style={styles.buttonFreezer}>
              <TouchableOpacity onPress={() => handleImageClick(data)}>
                <Image
                  source={imageSource} // Icône de congélateur
                  style={styles.freezerLogo}
                />
              </TouchableOpacity>
            </View>

            {/* Bouton pour supprimer un produit */}
            <View style={styles.buttonDelete}>
              <TouchableOpacity onPress={() => handleProductDelete(data)}>
                <FontAwesomeIcon
                  icon={faXmark} 
                  size={27}
                  color="#A77B5A"
                  style={styles.iconDelete}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      })
    : null;

  return (
    // Conteneur principal
    <View style={styles.container}>
      <Image
        source={require("../assets/Squirrel/Heureux.png")}
        style={styles.squirrel}
      />
      {/* Titre de la page */}
      <Text style={styles.PageTitle}>Mon Frigo</Text>
      {/* Conteneur des produits dans le frigo */}
      <View style={styles.productContainer}>
        {/* Affichage des produits */}
        <ScrollView style={{ flexGrow: 1 }}>{products}</ScrollView>
      </View>

      {/* Boutons d'accès au congélateur et aux placards */}
      <View style={styles.stocksButtonsContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePlacardPress}>
          <Text style={styles.buttonText}>Mes Placards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCongeloPress}>
          <Text style={styles.buttonText}>Mon Congelo</Text>
        </TouchableOpacity>
      </View>

      {/* Modal pour DLC courte */}
      <Modal
        transparent={true}
        visible={shortDlcModalVisible}
        animationType="slide"
        onRequestClose={() => setShortDlcModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>DLC courte !</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShortDlcModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal pour DLC longue */}
      <Modal
        transparent={true}
        visible={longDlcModalVisible}
        animationType="slide"
        onRequestClose={() => setLongDlcModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>DLC longue.</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setLongDlcModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Styles pour les différents éléments du composant
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE5D8", // Couleur de fond de la page
    alignItems: "center",
    justifyContent: "center",
  },
  squirrel: {
    position: "absolute",
    width: 50,
    height: 50,
    top: 50,
    left: 30,
  },
  PageTitle: {
    fontFamily: 'Hitchcut-Regular',
    color: "#E56400", // Couleur du titre
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  productContainer: {
    borderWidth: 1,
    backgroundColor: "#A77B5A",
    borderColor: "#A77B5A",
    width: "85%", // Largeur relative à l'écran
    height: "65%", // Hauteur relative à l'écran
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },

  ProductLineContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Pour espacer les éléments
    backgroundColor: "#FAF9F3",
    borderColor: "#A77B5A",
    borderWidth: 2,
    width: "100%",
    height: 52,
    borderRadius: 10,
    padding: 10,
    alignItems: "center", // Centrer verticalement
    marginTop: 5,
    marginBottom: 5,
  },
  ProductTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#E56400",
  },
  DlcButtonContainer: {
    alignItems: "center",
  },
  DlcContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: 47,
    borderRadius: 10,
    padding: 10,
    marginRight: 2, // Espace entre DlcContainer et buttonFreezer
    right: 10,
  },
  DlcText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  buttonFreezer: {
    justifyContent: "center",
    backgroundColor: "#FAF9F3",
    borderColor: "#A77B5A",
    borderWidth: 1,
    width: 50,
    height: 47,
    borderRadius: 10,
    alignItems: "center",
    right: 5,
  },
  freezerLogo: {
    width: 30,
    height: 30,
  },
  iconDelete: {

  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  squirrelModal: {
    justifyContent: "center",
    width: 95,
    height: 90,
    marginBottom: 30,
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#A77B5A",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
  },

  stocksButtonsContainer: {
    flexDirection: "row", // Aligne les boutons d'accès en ligne
  },
  button: {
    justifyContent: "center",
    backgroundColor: "#FAF9F3",
    borderColor: "#A77B5A",
    borderWidth: 1,
    width: 150,
    height: 70,
    borderRadius: 10,
    padding: 10,
    marginRight: 16,
    marginLeft: 16,
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
    color: "#E56400",
  },
  //couleurs DLC dynamiques
  redDlcContainer: {
    backgroundColor: "#FF6347", // Rouge
  },
  orangeDlcContainer: {
    backgroundColor: "#FFA500", // Orange
  },
  greenDlcContainer: {
    backgroundColor: "#69914a", // Vert
  },
});

export default FridgeScreen;
