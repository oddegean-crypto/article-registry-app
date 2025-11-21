#!/usr/bin/env python3
"""
Article Registry Backend API Test Suite
Tests all endpoints for the Article Registry application
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://textile-manager-4.preview.emergentagent.com/api"

class ArticleRegistryTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_article_id = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "API is healthy and database connected")
                else:
                    self.log_test("Health Check", False, "API responded but status not healthy", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
    
    def test_get_articles_empty(self):
        """Test GET /api/articles when empty"""
        try:
            response = requests.get(f"{self.base_url}/articles", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Articles (Empty)", True, f"Returned {len(data)} articles")
                else:
                    self.log_test("Get Articles (Empty)", False, "Response is not a list", data)
            else:
                self.log_test("Get Articles (Empty)", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Articles (Empty)", False, f"Request failed: {str(e)}")
    
    def test_create_article(self):
        """Test POST /api/articles with test data"""
        test_article = {
            "articleCode": "TEST001",
            "articleName": "Test Fabric",
            "colorCode": "COL001",
            "colorName": "Blue",
            "treatmentName": "Dyed",
            "supplier": "Test Supplier",
            "section": "Men",
            "season": "Spring 2024",
            "composition": "100% Cotton",
            "weightGSM": "200",
            "widthCM": "150",
            "basePriceEUR": "15.00"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/articles",
                json=test_article,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("articleCode") == "TEST001":
                    self.created_article_id = data["id"]
                    self.log_test("Create Article", True, f"Article created with ID: {self.created_article_id}")
                else:
                    self.log_test("Create Article", False, "Article created but missing expected fields", data)
            else:
                self.log_test("Create Article", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Create Article", False, f"Request failed: {str(e)}")
    
    def test_get_articles_with_data(self):
        """Test GET /api/articles after creating an article"""
        try:
            response = requests.get(f"{self.base_url}/articles", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    article = data[0]
                    if article.get("articleCode") == "TEST001":
                        self.log_test("Get Articles (With Data)", True, f"Found {len(data)} articles including TEST001")
                    else:
                        self.log_test("Get Articles (With Data)", False, "Articles found but TEST001 not present", data)
                else:
                    self.log_test("Get Articles (With Data)", False, "No articles returned after creation", data)
            else:
                self.log_test("Get Articles (With Data)", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Articles (With Data)", False, f"Request failed: {str(e)}")
    
    def test_get_single_article(self):
        """Test GET /api/articles/{id}"""
        if not self.created_article_id:
            self.log_test("Get Single Article", False, "No article ID available from previous test")
            return
            
        try:
            response = requests.get(f"{self.base_url}/articles/{self.created_article_id}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.created_article_id and data.get("articleCode") == "TEST001":
                    self.log_test("Get Single Article", True, f"Retrieved article {self.created_article_id}")
                else:
                    self.log_test("Get Single Article", False, "Article retrieved but data mismatch", data)
            elif response.status_code == 404:
                self.log_test("Get Single Article", False, "Article not found (404)")
            else:
                self.log_test("Get Single Article", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Single Article", False, f"Request failed: {str(e)}")
    
    def test_bulk_import(self):
        """Test POST /api/articles/bulk with append mode"""
        bulk_articles = {
            "mode": "append",
            "articles": [
                {
                    "articleCode": "BULK001",
                    "articleName": "Bulk Test Fabric 1",
                    "colorCode": "COL002",
                    "colorName": "Red",
                    "treatmentName": "Raw",
                    "supplier": "Bulk Supplier",
                    "section": "Women",
                    "season": "Summer 2024",
                    "composition": "80% Cotton, 20% Polyester",
                    "weightGSM": "180",
                    "widthCM": "140",
                    "basePriceEUR": "12.50"
                },
                {
                    "articleCode": "BULK002",
                    "articleName": "Bulk Test Fabric 2",
                    "colorCode": "COL003",
                    "colorName": "Green",
                    "treatmentName": "Washed",
                    "supplier": "Bulk Supplier",
                    "section": "Kids",
                    "season": "Fall 2024",
                    "composition": "100% Organic Cotton",
                    "weightGSM": "160",
                    "widthCM": "130",
                    "basePriceEUR": "18.00"
                }
            ]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/articles/bulk",
                json=bulk_articles,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("total") == 2:
                    self.log_test("Bulk Import", True, f"Imported {data.get('inserted', 0)} new, updated {data.get('updated', 0)} existing")
                else:
                    self.log_test("Bulk Import", False, "Bulk import completed but unexpected response", data)
            else:
                self.log_test("Bulk Import", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Bulk Import", False, f"Request failed: {str(e)}")
    
    def test_search_functionality(self):
        """Test GET /api/articles?search=TEST"""
        try:
            response = requests.get(f"{self.base_url}/articles?search=TEST", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    test_articles = [a for a in data if "TEST" in a.get("articleCode", "")]
                    if len(test_articles) > 0:
                        self.log_test("Search Functionality", True, f"Found {len(test_articles)} articles matching 'TEST'")
                    else:
                        self.log_test("Search Functionality", False, "No articles found matching 'TEST'", data)
                else:
                    self.log_test("Search Functionality", False, "Response is not a list", data)
            else:
                self.log_test("Search Functionality", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Search Functionality", False, f"Request failed: {str(e)}")
    
    def test_update_article(self):
        """Test PUT /api/articles/{id}"""
        if not self.created_article_id:
            self.log_test("Update Article", False, "No article ID available from previous test")
            return
            
        updated_data = {
            "articleCode": "TEST001",
            "articleName": "Updated Test Fabric",
            "colorCode": "COL001",
            "colorName": "Dark Blue",
            "treatmentName": "Dyed",
            "supplier": "Updated Supplier",
            "section": "Men",
            "season": "Spring 2024",
            "composition": "100% Cotton",
            "weightGSM": "220",
            "widthCM": "155",
            "basePriceEUR": "16.50"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/articles/{self.created_article_id}",
                json=updated_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("articleName") == "Updated Test Fabric" and data.get("weightGSM") == "220":
                    self.log_test("Update Article", True, f"Article {self.created_article_id} updated successfully")
                else:
                    self.log_test("Update Article", False, "Article updated but data mismatch", data)
            elif response.status_code == 404:
                self.log_test("Update Article", False, "Article not found for update (404)")
            else:
                self.log_test("Update Article", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Update Article", False, f"Request failed: {str(e)}")
    
    def test_delete_article(self):
        """Test DELETE /api/articles/{id}"""
        if not self.created_article_id:
            self.log_test("Delete Article", False, "No article ID available from previous test")
            return
            
        try:
            response = requests.delete(f"{self.base_url}/articles/{self.created_article_id}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Article", True, f"Article {self.created_article_id} deleted successfully")
                    # Verify deletion
                    verify_response = requests.get(f"{self.base_url}/articles/{self.created_article_id}", timeout=10)
                    if verify_response.status_code == 404:
                        self.log_test("Delete Verification", True, "Article confirmed deleted (404 on GET)")
                    else:
                        self.log_test("Delete Verification", False, f"Article still exists after deletion: HTTP {verify_response.status_code}")
                else:
                    self.log_test("Delete Article", False, "Delete response success=false", data)
            elif response.status_code == 404:
                self.log_test("Delete Article", False, "Article not found for deletion (404)")
            else:
                self.log_test("Delete Article", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Delete Article", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Article Registry API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_health_check()
        self.test_get_articles_empty()
        self.test_create_article()
        self.test_get_articles_with_data()
        self.test_get_single_article()
        self.test_bulk_import()
        self.test_search_functionality()
        self.test_update_article()
        self.test_delete_article()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = ArticleRegistryTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)