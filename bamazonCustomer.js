// import { createConnection } from 'net';
var inquirer = require("inquirer");

module.require("./passkeys");

var passkey = require('./passkeys')

//connect to the mysql server and sql data base
passkey.connection.connect(function (err) {
    if (err) console.log(err);
    //run the start shopping function after the connection is made to prompt customer of what to buy
    startShopping();
});

//this function will show prompts for the user to select from products
function startShopping() {
    passkey.connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        console.log("_______________________________\nItems a available for purchase\n_______________________________");
        for (var items = 0; items < res.length; items++) {
            console.log(res[items].item_id +
                " | " + res[items].product_name +
                " | " + res[items].department_name +
                " | Price: $ " + res[items].price +
                " | Quantity: " + res[items].stock_quantity);
        }
        console.log("___________________________________________________________")
        //query database for all items being selected
        passkey.connection.query("SELECT * FROM products", function (err, res) {
            if (err) throw err;
            //npm inquirer prompt to select quantity of item desired
            inquirer
                .prompt([{
                    name: "products",
                    type: "list",
                    choices: function () {
                        var choices = [];
                        for (var x = 0; x < res.length; x++) {
                            choices.push(res[x].item_id.toString() + " " + res[x].product_name);

                        }
                        return choices;
                    },
                    message: "Which product would you like to select? "
                }

                ])
                .then(function (answer) {
                    //when prompts finish, insert a new item into the database
                    console.log(answer)

                    var splitItem_id = answer.products.split(" ", 1);
                    
                    var chosenAmount = parseInt(splitItem_id - 1);
                    inquirer.prompt([{
                        name: "stock_quantity",
                        type: "input",
                        message: "How many would you like?",
                        validate: function (value) {
                            if (parseInt(value) < 0) {
                                console.log("\nPlease enter a positive value")
                                return false;
                            }
                            if ((isNaN(value) === false) && (res[chosenAmount].stock_quantity >= parseInt(value))) {
                                return true;
                            }
                            console.log("\nQuantity specified not in supply. Please specify a different amount.")
                            return false;
                        }
                    }]).then(function (ans) {
                        //Updates MySQL database
                        passkey.connection.query(
                            "UPDATE products SET ? WHERE ?", [{
                                stockQuantity: (res[chosenAmount].stockQuantity - ans.quantityPurchased)
                            },
                            {
                                id: chosenAmount + 1
                            }
                            ],
                            function (err, res) {
                                if (err) throw err;
                            }

                        )
                        console.log("\nCongratulations. You have purchased " + ans.quantityPurchased + " " +
                            res[chosenAmount].productName + "(s) @ $" + res[chosenAmount].price + " for a grand total of: $" +
                            (res[chosenAmount].price * ans.quantityPurchased) + "!\n");

                        restartPrompt();
                    });

                    function restartPrompt() {
                        inquirer.prompt([{
                            name: "restart",
                            type: "list",
                            message: "Would you like to make another purchase?",
                            choices: ["Yes", "No"]
                        }]).then(function (answer) {
                            if (answer.restart === "Yes") {
                                start();
                            } else {
                                passkey.connection.end();
                            };
                        });
                    };
                });
        });

    });

}
