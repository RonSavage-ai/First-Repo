import requests
import sys
from datetime import datetime

class ThreadMartAPITester:
    def __init__(self, base_url="https://thread-mart-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout}s")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": "Timeout"
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )
        return success

    def test_trending_endpoint(self):
        """Test the trending searches endpoint"""
        success, response = self.run_test(
            "Trending Searches",
            "GET",
            "api/trending",
            200
        )
        
        if success and response:
            # Validate response structure
            if 'trending' in response and isinstance(response['trending'], list):
                print(f"   Found {len(response['trending'])} trending items")
                return True
            else:
                print(f"   Warning: Response missing 'trending' array")
                return False
        return success

    def test_search_endpoint_without_key(self):
        """Test search endpoint without SERPAPI_KEY (should return 500)"""
        success, response = self.run_test(
            "Search Without API Key",
            "GET",
            "api/search?q=jeans&num=5",
            500  # Expected to fail without API key
        )
        return success

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        test_data = {
            "client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"
        }
        
        post_success, post_response = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data=test_data
        )
        
        # Test GET status
        get_success, get_response = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        
        return post_success and get_success

def main():
    print("🚀 Starting ThreadMart API Tests")
    print("=" * 50)
    
    # Setup
    tester = ThreadMartAPITester()

    # Run basic API tests
    print("\n📋 Testing Basic API Endpoints...")
    tester.test_root_endpoint()
    tester.test_trending_endpoint()
    
    print("\n📋 Testing Search API (without key)...")
    tester.test_search_endpoint_without_key()
    
    print("\n📋 Testing Status Endpoints...")
    tester.test_status_endpoints()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Status {test.get('actual', 'unknown')}")
            print(f"   - {test['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())